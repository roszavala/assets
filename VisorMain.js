import React from "react";
import { injectIntl, FormattedMessage } from 'react-intl';

import ImageManager from './ImageManager';
import Visor from './Visor';
import Serie from './Serie';
import VisorTypes from './VisorTypes';

import Request from '../../../src/utils/Request';
import { publicURLManager } from '../../resources/Urls';

import FileAttachment from "../commons/FileAttachment";
import { Col, Row, Button } from "antd";
import { ReactComponent as ImgInformation } from '../../assets/img/visor-mobile/imgInformation.svg';
import { ReactComponent as ImgReport } from '../../assets/img/visor-mobile/imgReport.svg';
import { ReactComponent as ImgSeries } from '../../assets/img/visor-mobile/imgSeries.svg';
import { ReactComponent as ImgAttachments } from '../../assets/img/visor-mobile/imgAttachments.svg';
import { ReactComponent as ImgVisor } from '../../assets/img/visor-mobile/imgVisor.svg';
import { ReactComponent as ImgDiposition } from '../../assets/img/visor-mobile/imgDiposition.svg';
import { ReactComponent as ImgFull } from '../../assets/img/visor-mobile/imgFull.svg';
import VisorEcg from "./VisorEcg";
//import ECGVisor from "../text-editor/ECGVisorEditor";


//Import all styles
import('../visor/layout.scss');
import('./layout.scss');
import('./style-visor.scss');

class VisorMain extends React.Component {

    constructor(props) {
        super(props);
        this.type = props.type;
        this.shareUid = "";
        this.state = {
            viewInfoPatient: true,
            viewAttachments: false,
            menuInfoPatient: false,
            menuAttachments: false,
            menuReportPdf: false,
            menuVisor: true,
            menuSeries: 'mobile-hide',
            mnVisor: 'mobile-active',
            mnSeries: '',
            mnReport: '',
            mnInformation: '',
            mnAttachments: '',
            cssSeries: 'mobile-hide',

            data: {},
            stacks: [],
            currentStackIndex: 0,
            seriesIndex: 0,
            patient: {},
            collapsed: false,
            currentVisor: 0,
            layout: 1,
            pdf: false,
            showPdf: false,
            visorHeight: "100%",
            fullScreen: false
        };
        this.active = 'mobile-active';
        this.inactive = '';
        this.show = 'show';
        this.hide = 'mobile-hide';
        this.shareUid = "";
        this.menu = {
            mnVisor: 0,
            mnSeries: 1,
            mnReport: 2,
            mnInformation: 3,
            mnAttachments: 4
        }

        this.visor1 = React.createRef();
        this.visor2 = React.createRef();
        this.visor3 = React.createRef();
        this.visor4 = React.createRef();
        this.visors = [this.visor1, this.visor2, this.visor3, this.visor4];
        this.downloadVisor = this.visor1;
        this.modalityECG = 'ECG';
    }

    componentDidMount() {
        let urlData = {};
        if (this.type === VisorTypes.xcard) {
            let studyId = this.props.studyId;
            this.shareUid = studyId;
            urlData = publicURLManager.get("patient", "getStudy");
            urlData.url = urlData.url.replace("{studyId}", studyId);
        }
        else if (this.type === VisorTypes.public) {
            let loc = window.location.href.split('uid=');
            this.shareUid = ""
            if (loc.length === 2) {
                this.shareUid = loc[1];
            }
            else {
                return;
            }
            ImageManager.setShareId(this.shareUid);
            urlData = publicURLManager.get("study", "get");
            urlData.url = urlData.url + '?uid=' + this.shareUid;
        }
        else {
            throw new Error("El tipo de visor no es valido.");
        }
        ImageManager.setShareId(this.shareUid);
        Request.httpStandardRequest(urlData.url,
            urlData.method,
            null,
            data => {
                let stacks = [];
                let seriesIndex = 0;
                const type = this.type;
                const shareUid = this.shareUid;
                if (data.modality !== this.modalityECG){
                    data.series.forEach(function (series) {
                        let stack = {
                            seriesDescription: series.serieDescription,
                            stackId: series.serieId,
                            imageIds: [],
                            seriesIndex: seriesIndex,
                            currentImageIdIndex: 0
                        };
                        series.imageInstanceList.forEach((image) => {
                            let imageId = image.sopInstanceUid;
                            if (type === VisorTypes.xcard) {
                                let toStack = publicURLManager.get("patient", "images").url
                                    .replace('{sopInstanceUid}', imageId);
                                stack.imageIds.push(toStack);
                            }
                            else if (type === VisorTypes.public) {
                                let toStack = publicURLManager.get("study", "images").url
                                    .replace('{shareUid}', shareUid)
                                    .replace('{sopInstanceUid}', imageId);
                                stack.imageIds.push(toStack);
                            }
                        });
                        seriesIndex++;
                        stacks.push(stack);
                    });
                    this.setState(
                        {
                            data: data,
                            stacks: stacks,
                            seriesIndex: seriesIndex.stacks,
                            patient: data.patient,
                            dataEcgVisor: data.ecgStudyDataResponse
                        }
                        , () => {
                            this.downloadPDF();
                        }
                    );
                } else {
                    this.setState(
                        {
                            data:data,
                            patient: data.patient,
                            dataEcgVisor: data.ecgStudyDataResponse
                        },
                        () => {
                            this.downloadPDF();
                        }
                    )
                }
            },
            (data) => {
                console.log("¡Ocurrio un error al realizar la consulta!", data)
            });
    }

    isIOS = () => {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return true;
        }

        return false;
    }

    componentWillMount() {
        this.computeVisorHeight();
        window.addEventListener('resize', this.computeVisorHeight);
    }

    downloadSerie = (serie) => {
        this.downloadVisor.current.downloadSerie(serie);
    }

    selectImage = (serie, imagen, index = undefined) => {
        this.setState({
            menuSeries: this.hide
        });
        this.viewVisor();
        this.visors[this.state.currentVisor].current.selectImage(serie, imagen, index);
    }

    downloadSerie = (serie) => {
        this.downloadVisor.current.downloadSerie(serie);
    }

    getViewSeries = () => {
        return <Row className="mobile-menuSeries" >
            <Col xs={24} sm={24} md={24} lg={24} className="mobile-mainSeries">
                <div className={"seriesDataMobile " + this.state.cssSeries}><React.Fragment>
                    {
                        this.state.stacks.map(
                            (item) =>
                                <Serie key={item.stackId} shareUid={this.shareUid} serie={item} selectImage={this.selectImage} downloadSerie={this.downloadSerie} type={this.type} />
                        )
                    }
                </React.Fragment></div>
            </Col>
        </Row>;
    }

    selectVisor = (id) => {
        this.setState({
            currentVisor: id
        });
    }

    selectLayout = (layout) => {
        this.setState({
            layout: 1
        }, () => {
            this.setState({
                currentVisor: 0,
                layout: layout
            });
        });
    }

    viewPdf = () => {
        const downloadLink = document.createElement("a");
        const fileName = "informe_" + this.state.patient.mnr + ".pdf";

        downloadLink.href = this.state.pdf;
        downloadLink.download = fileName;
        downloadLink.click();
    }

    downloadPDF = () => {
        let urlData = {};
        let uri = "";
        if (this.type === VisorTypes.xcard) {
            urlData = publicURLManager.get("patient", "pdf");
            uri = urlData.url.replace("{studyId}", this.state.data.studyId);
        }
        else if (this.type === VisorTypes.public) {
            urlData = publicURLManager.get("study", "pdf");
            uri = urlData.url.replace("{shareUid}", this.shareUid);
        }
        Request.httpStandardRequest(uri, urlData.method, null,
            (response) => {
                this.setState({
                    pdf: "data:application/pdf;base64," + response.base64File,
                    currentReportId: this.shareUid
                });
            },
            (response) => {
                new Error("Error al obtener el pdf", response.message !== undefined ? response.userMessage : response.message);
            }
        );
    }

    selectMenu = (option) => {
        let json = {
            mnVisor: this.inactive,
            mnSeries: this.inactive,
            mnReport: this.inactive,
            mnInformation: this.inactive,
            mnAttachments: this.inactive
        };
        switch (option) {
            case 0: json.mnVisor = this.active; break;
            case 1: json.mnSeries = this.active; break;
            case 2: json.mnReport = this.active; break;
            case 3: json.mnInformation = this.active; break;
            case 4: json.mnAttachments = this.active; break;
            default: break;
        }
        this.setState(json);
    }

    onMenuInfoPatient = () => {
        if (!this.state.menuInfoPatient) {
            this.setState({
                menuInfoPatient: true,
                menuReportPdf: false,
                menuVisor: false,
                menuAttachments: false,
                menuSeries: this.hide
            }, () => {
                this.selectMenu(this.menu.mnInformation);
            });
        }
    }

    onMenuAttachments = () => {
        if (!this.state.menuAttachments) {
            this.setState({
                menuInfoPatient: false,
                menuReportPdf: false,
                menuVisor: false,
                menuAttachments: true,
                menuSeries: this.hide
            }, () => {
                this.selectMenu(this.menu.mnAttachments);
            });
        }
    }

    onMenuReportPdf = () => {
        if (!this.state.menuReportPdf) {
            this.setState({
                menuInfoPatient: false,
                menuReportPdf: true,
                menuVisor: false,
                menuAttachments: false,
                menuSeries: this.hide
            }, () => {
                this.selectMenu(this.menu.mnReport);
            });
        }
    }

    onMenuSeries = () => {
        if (!this.state.menu) {
            this.setState({
                menuInfoPatient: false,
                menuReportPdf: false,
                menuVisor: false,
                menuAttachments: false,
                menuSeries: this.show,
                cssSeries: this.show
            }, () => {
                this.selectMenu(this.menu.mnSeries);
            });
        } else {
            this.setState({
                menuSeries: this.hide
            });
        }
    }

    isIOS


    getMenuPdf = () => {
        return <div className={this.state.showPdf ? "mobile-pdf-container mobile-show-pdf" : "mobile-pdf-container"}>
            <div className="mobile-collapse-extend" onClick={() => this.setState({ showPdf: !this.state.showPdf })}>
                <i className={this.state.showPdf ? "fas fa-caret-right" : "fas fa-caret-left"}></i>
            </div>
            <div className="mobile-pdf-content">
                {(this.state.showPdf && this.state.pdf &&
                    this.getViewPdf()
                )}
            </div>
        </div>;
    }

    getViewPdf = () => {
        return <object className="mobile-pdf-wrapper" data={this.state.pdf + "#zoom=100"} type="application/pdf">
            <embed src={this.state.pdf} type="application/pdf" />
            <param name="zoom" value="100" />
        </object>;
    }


    getPdfMobile = () => {
        if (this.isIOS()) {
            return <Row>
                <Col xs={24} sm={24} md={24} lg={24} className="mobile-pdfMobile">
                    {(this.state.pdf &&
                        <div className="dvButtonDownload">
                            <Button type="primary" icon="download" size="large" onClick={this.viewPdf}>
                                <FormattedMessage id="app.visor2.patient.donwload" />
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>;
        } else {
            return <Row>
                <Col xs={24} sm={24} md={24} lg={24} className="mobile-pdfMobile">
                    {(this.state.pdf &&
                        <div className="dvButtonDownload">
                             {this.getViewPdf()}
                        </div>
                    )}
                </Col>
            </Row>;
        }
    }

    onGetPatient = () => {
        this.setState({
            viewInfoPatient: !this.state.viewInfoPatient
        });
    }

    onGetAttachments = () => {
        this.setState({
            viewAttachments: !this.state.viewAttachments
        });
    }

    getInfoPatient = () => {
        return <div className="mobile-infoPatient">
            <div className="mobile-rowInfo">
                <div className="mobile-titleInfo"><FormattedMessage id="app.visor2.patient.name" /></div>
                <div className="mobile-content">{this.state.patient.name + ' ' + this.state.patient.lastName + ' ' + (this.state.patient.motherLastName ? this.state.patient.motherLastName : '')}</div>
            </div>
            <div className="mobile-rowInfo">
                <div className="mobile-titleInfo"><FormattedMessage id="app.visor2.patient.birthDate" /></div>
                <div className="mobile-content">{this.state.patient.birthDate ? (typeof this.state.patient.birthDate === 'object' ? this.birthDateToString(this.state.patient.birthDate) : this.state.patient.birthDate) : ""}</div>
            </div>
            <div className="mobile-rowInfo">
                <div className="mobile-titleInfo"><FormattedMessage id="app.visor2.patient.modality" /></div>
                <div className="mobile-content">{this.state.data.modality}</div>
            </div>
            <div className="mobile-rowInfo">
                <div className="mobile-titleInfo"><FormattedMessage id="app.visor2.patient.studyDate" /></div>
                <div className="mobile-content">{this.state.data.studyDate}</div>
            </div>
            <div className="mobile-rowInfo">
                <div className="mobile-titleInfo"><FormattedMessage id="app.visor2.patient.studyTime" /></div>
                <div className="mobile-content">{this.state.data.studyTime}</div>
            </div>
        </div>;
    }

    getMenuInfoPatient = () => {
        return <Row className="mobile-menuInfoPatient">
            <Col xs={24} sm={24} md={24} lg={24} className="mobile-mainDatePatient">
                <div className="mobile-title">
                    <div>
                        <FormattedMessage id="app.visor2.date.patient" />
                    </div>
                </div>
                {this.getInfoPatient()}
            </Col>
        </Row>;
    }

    getAttachments = () => {
        return <div className="mobile-infoPatient">
            <Row>
                {
                    this.state.data.attachments.map((file) => {
                        let serviceDownload = {};
                        if (this.type === VisorTypes.xcard) {
                            serviceDownload = publicURLManager.get("patient", "attachment");
                            serviceDownload.url = serviceDownload.url.replace("{hashKey}", file.uid);
                        }
                        else if (this.type === VisorTypes.public) {
                            serviceDownload = publicURLManager.get("study", "attachment");
                            serviceDownload.url = serviceDownload.url.replace("{hashKey}", file.uid);
                            serviceDownload.url = serviceDownload.url.replace("{shareUid}", this.shareUid);
                        }
                        return (
                            <Col key={file.uid} xs={24} sm={12} md={12} lg={12} xl={12}>
                                <FileAttachment data={file} serviceDownload={serviceDownload} showPreview={true} showFileName={true} border="none" />
                            </Col>
                        )
                    })
                }
            </Row>
        </div>;
    }

    getMenuInfoAttachments = () => {
        return <Row className="mobile-menuInfoPatient">
            <Col xs={24} sm={24} md={24} lg={24} className="mobile-mainDatePatient">
                <div className="mobile-title">
                    <div>
                        <FormattedMessage id="app.visor2.attachments" />
                    </div>
                </div>
                <div className="mobile-attachments">
                    {this.getAttachments()}
                </div>
            </Col>
        </Row>;
    }

    getMenuSeries = () => {
        return <Row className="mobile-menuInfoPatient">
            <Col xs={24} sm={24} md={24} lg={24} className="mobile-mainDatePatient">
                <div className="mobile-title">
                    <div>
                        Series
                    </div>
                </div>
                {this.getSeries()}
            </Col>
        </Row>;
    }

    getSeries = () => {
        if (this.state.cssSeries === this.show) {
            this.setState({
                cssSeries: this.hide
            });
        } else {
            this.setState({
                cssSeries: this.show
            });
        }
    }

    getResolutionSeries = () => {
        //para resoluciones de escritorio
        if (Number(window.innerWidth) < 991) {
            return <div className={this.state.menuSeries}>{this.getViewSeries()}</div>;
        } else {
            return null;
        }
    }

    onGetSerie = () => {
        this.setState({
            viewSeries: !this.state.viewSeries
        });
    }

    viewVisor = () => {
        if (!this.state.menuVisor) {
            this.setState({
                menuInfoPatient: false,
                menuReportPdf: false,
                menuVisor: true,
                menuSeries: this.hide,
                menuAttachments: false
            }, () => {
                this.selectMenu(this.menu.mnVisor);
            });
        }
    }

    computeVisorHeight = () => {
        const windownHeight = window.innerHeight;
        this.setState({
            visorHeight: (windownHeight - 58) + "px"
        });
    }

    fullScreen = () => {
        let elem = document.getElementById("root");
        if (elem.requestFullscreen) {
            elem.requestFullscreen();            
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
        this.setState({
            fullScreen: true
        }, () => window.dispatchEvent(new Event('resize')));
    }

    closeFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        this.setState({
            fullScreen: false
        }, () => window.dispatchEvent(new Event('resize')));
    }

    render() {
        const { formatMessage } = this.props.intl;
        let visores;
        let visor1 = <Visor shareUid={this.shareUid} ref={this.visors[0]} stacks={{ ...this.state.stacks }} data={this.state.data} type={this.type} />;
        let visor2 = <Visor shareUid={this.shareUid} ref={this.visors[1]} stacks={{ ...this.state.stacks }} data={this.state.data} type={this.type} />;
        let visor3 = <Visor shareUid={this.shareUid} ref={this.visors[2]} stacks={{ ...this.state.stacks }} data={this.state.data} type={this.type} />;
        let visor4 = <Visor shareUid={this.shareUid} ref={this.visors[3]} stacks={{ ...this.state.stacks }} data={this.state.data} type={this.type} />;
        let ecg = <VisorEcg key={0} data={this.state.dataEcgVisor}/>;
        if (this.state.layout === 1) {
            visores = (
                <div className="mobile-visor-1">
                    {visor1}
                </div>
            );
        }
        else if (this.state.layout === 2) {
            visores = (
                <div className="mobile-visor-1">
                    <div onClick={() => { this.selectVisor(0); }} className={this.state.currentVisor === 0 ? "mobile-visor-2 mobile-active" : "mobile-visor-2"}>
                        {visor1}
                    </div>
                    <div onClick={() => { this.selectVisor(1); }} className={this.state.currentVisor === 1 ? "mobile-visor-2 mobile-active" : "mobile-visor-2"}>
                        {visor2}
                    </div>
                </div>
            );
        }
        else if (this.state.layout === 3) {
            visores = (
                <div className="mobile-visor-1">
                    <div onClick={() => { this.selectVisor(0); }} className={this.state.currentVisor === 0 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                        {visor1}
                    </div>
                    <div onClick={() => { this.selectVisor(1); }} className={this.state.currentVisor === 1 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                        {visor2}
                    </div>
                </div>
            );
        }
        else if (this.state.layout === 4) {
            visores = (
                <div className="mobile-visor-1">
                    <div className=" mobile-visor-2">
                        <div onClick={() => { this.selectVisor(0); }} className={this.state.currentVisor === 0 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                            {visor1}
                        </div>
                        <div onClick={() => { this.selectVisor(1); }} className={this.state.currentVisor === 1 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                            {visor2}
                        </div>
                    </div>
                    <div onClick={() => { this.selectVisor(2); }} className={this.state.currentVisor === 2 ? "mobile-visor-2 mobile-active" : "mobile-visor-2"}>
                        {visor3}
                    </div>
                </div>
            );
        }
        else if (this.state.layout === 5) {
            visores = (
                <div className="mobile-visor-1">
                    <div onClick={() => { this.selectVisor(0); }} className={this.state.currentVisor === 0 ? "mobile-visor-2 mobile-active" : "mobile-visor-2"}>
                        {visor1}
                    </div>
                    <div className=" mobile-visor-2">
                        <div onClick={() => { this.selectVisor(1); }} className={this.state.currentVisor === 1 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                            {visor2}
                        </div>
                        <div onClick={() => { this.selectVisor(2); }} className={this.state.currentVisor === 2 ? "mobile-visor-3 mobile-active" : "mobile-visor-3"}>
                            {visor3}
                        </div>
                    </div>
                </div>
            );
        }
        else if (this.state.layout === 6) {
            visores = (
                <div className="mobile-visor-1">
                    <div onClick={() => { this.selectVisor(0); }} className={this.state.currentVisor === 0 ? "mobile-visor-4 mobile-active" : "mobile-visor-4"}>
                        {visor1}
                    </div>
                    <div onClick={() => { this.selectVisor(1); }} className={this.state.currentVisor === 1 ? "mobile-visor-4 mobile-active" : "mobile-visor-4"}>
                        {visor2}
                    </div>
                    <div onClick={() => { this.selectVisor(2); }} className={this.state.currentVisor === 2 ? "mobile-visor-4 mobile-active" : "mobile-visor-4"}>
                        {visor3}
                    </div>
                    <div onClick={() => { this.selectVisor(3); }} className={this.state.currentVisor === 3 ? "mobile-visor-4 mobile-active" : "mobile-visor-4"}>
                        {visor4}
                    </div>
                </div>
            );
        }
        if (this.state.data.modality !== this.modalityECG){
            return (
                <div>
                    <Row>
                        <Col xs={24} sm={24} md={24} lg={5} className="mobile-header">
                            <Row>
                                <Col lg={10} xs={4} sm={4} md={4}>
                                    <img src="/assets/img/ptm_logo.png" alt="PTM PACS" className="mobile-imgPtm" />
                                </Col>
                                <Col lg={14} >
                                    <p className="mobile-titleVisor">{formatMessage({ id: "app.visor2.title" })}</p>
                                </Col>
                                <Col xs={20} sm={20} md={20} className="mobile-menuOptions">
                                    <div><ImgInformation onClick={this.onMenuInfoPatient} className={this.state.mnInformation} /></div>
                                    <div><ImgReport onClick={this.onMenuReportPdf} className={this.state.mnReport} /></div>
                                    <div><ImgSeries onClick={this.onMenuSeries} className={this.state.mnSeries} /></div>
                                    {(this.state.data && this.state.data.attachments && this.state.data.attachments.length > 0) &&
                                        <div><ImgAttachments onClick={this.onMenuAttachments} className={this.state.mnAttachments} /></div>
                                    }
                                    <div><ImgVisor onClick={this.viewVisor} className={this.state.mnVisor} /></div>
                                </Col>
                                <Col lg={24} xs={24} sm={24} md={24} className="mobile-information">
                                    <div className="mobile-titleInfo mobile-dvPatient" onClick={this.onGetPatient}>
                                        <div className="mobile-titleInfo">
                                            <ImgInformation />
                                            {formatMessage({ id: "app.visor2.date.patient" })}
                                        </div>
                                        {this.state.viewInfoPatient ? this.getInfoPatient() : null}
                                    </div>
                                    {!this.state.showPdf &&
                                        <div className="mobile-dvPatient" onClick={() => this.setState({ showPdf: true })}>
                                            <ImgReport />
                                            {formatMessage({ id: "app.visor2.view.report" })}
                                        </div>
                                    }
                                    {this.state.showPdf &&
                                        <div className="mobile-dvPatient" onClick={() => this.setState({ showPdf: false })}>
                                            <ImgReport />
                                            {formatMessage({ id: "app.visor2.view.report.hide" })}
                                        </div>
                                    }
                                    {(this.state.data && this.state.data.attachments && this.state.data.attachments.length > 0) &&
                                        <div className="mobile-titleInfo mobile-dvPatient" onClick={this.onGetAttachments}>
                                            <div className="mobile-titleInfo">
                                                <ImgAttachments />
                                                {formatMessage({ id: "app.visor2.attachments" })}
                                            </div>
                                            {this.state.viewAttachments ? this.getAttachments() : null}
                                        </div>
                                    }
                                    <div className="mobile-titleInfo mobile-dvPatient" id="contentSeries">
                                        <div className="mobile-titleInfo cursor" onClick={this.getSeries}>
                                            <ImgSeries />
                                            {formatMessage({ id: "app.visor2.view.series" })}
                                        </div>
                                        <div className="mobile-seriesLg">{this.getViewSeries()}</div>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={24} sm={24} md={24} lg={19} className="mobile-visor">
                            <Row>
                                <Col xs={24} sm={24} md={24} lg={24} className="mobile-toolBar mobile-position" id="topToolBar">
                                    <div className="mobile-tools">
                                        <ImgDiposition />
                                        <div className="mobile-options">
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(1) }}>
                                                <i className="fas fa-square"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.one" />
                                            </div>
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(2) }}>
                                                <i className="fas fa-columns"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.two.vertical" />
                                            </div>
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(3) }}>
                                                <i className="fas fa-columns fa-rotate-270"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.two.horizontal" />
                                            </div>
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(4) }}>
                                                <i className="fab fa-trello fa-flip-horizontal"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.three.right" />
                                            </div>
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(5) }}>
                                                <i className="fab fa-trello"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.three.left" />
                                            </div>
                                            <div className="mobile-tool" onClick={() => { this.selectLayout(6) }}>
                                                <i className="fas fa-th-large"></i> &nbsp; <FormattedMessage id="app.visor.menu.layout.four" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mobile-tools" onClick={this.state.fullScreen ? this.closeFullScreen : this.fullScreen}><ImgFull /></div>
                                </Col>
                                <Col xs={24} sm={24} md={24} lg={24} className="mobile-display" style={{ height: this.state.visorHeight }}>
                                    {this.state.stacks.length > 0 &&
                                        visores
                                    }
                                    {this.state.stacks.length === 0 &&
                                        <div className="mobile-loading">
                                            <img src="/assets/img/loading.gif" width="64" height="64" alt="loading" />
                                        </div>
                                    }
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    {this.state.menuInfoPatient ? this.getMenuInfoPatient() : null}
                    {this.state.menuReportPdf ? this.getPdfMobile() : null}
                    {this.state.menuAttachments ? this.getMenuInfoAttachments() : null}
                    {this.getResolutionSeries()}
                    {this.getMenuPdf()}
                </div>
            );
        }
        if(this.state.data.modality === this.modalityECG){
            console.log("Ingresando al ECG visor");
            return (
                <div>
                    <Row>
                        <Col xs={24} sm={24} md={24} lg={5} className="mobile-header">
                            <Row>
                                <Col lg={10} xs={4} sm={4} md={4}>
                                    <img src="/assets/img/ptm_logo.png" alt="PTM PACS" className="mobile-imgPtm" />
                                </Col>
                                <Col lg={14} >
                                    <p className="mobile-titleVisor">{formatMessage({ id: "app.visor2.title" })}</p>
                                </Col>
                                <Col xs={20} sm={20} md={20} className="mobile-menuOptions">
                                    <div><ImgInformation onClick={this.onMenuInfoPatient} className={this.state.mnInformation} /></div>
                                    <div><ImgReport onClick={this.onMenuReportPdf} className={this.state.mnReport} /></div>
                                    <div><ImgSeries onClick={this.onMenuSeries} className={this.state.mnSeries} /></div>
                                    {(this.state.data && this.state.data.attachments && this.state.data.attachments.length > 0) &&
                                        <div><ImgAttachments onClick={this.onMenuAttachments} className={this.state.mnAttachments} /></div>
                                    }
                                    <div><ImgVisor onClick={this.viewVisor} className={this.state.mnVisor} /></div>
                                </Col>
                                <Col lg={24} xs={24} sm={24} md={24} className="mobile-information">
                                    <div className="mobile-titleInfo mobile-dvPatient" onClick={this.onGetPatient}>
                                        <div className="mobile-titleInfo">
                                            <ImgInformation />
                                            {formatMessage({ id: "app.visor2.date.patient" })}
                                        </div>
                                        {this.state.viewInfoPatient ? this.getInfoPatient() : null}
                                    </div>
                                    {!this.state.showPdf &&
                                        <div className="mobile-dvPatient" onClick={() => this.setState({ showPdf: true })}>
                                            <ImgReport />
                                            {formatMessage({ id: "app.visor2.view.report" })}
                                        </div>
                                    }
                                    {this.state.showPdf &&
                                        <div className="mobile-dvPatient" onClick={() => this.setState({ showPdf: false })}>
                                            <ImgReport />
                                            {formatMessage({ id: "app.visor2.view.report.hide" })}
                                        </div>
                                    }
                                    {(this.state.data && this.state.data.attachments && this.state.data.attachments.length > 0) &&
                                        <div className="mobile-titleInfo mobile-dvPatient" onClick={this.onGetAttachments}>
                                            <div className="mobile-titleInfo">
                                                <ImgAttachments />
                                                {formatMessage({ id: "app.visor2.attachments" })}
                                            </div>
                                            {this.state.viewAttachments ? this.getAttachments() : null}
                                        </div>
                                    }
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={24} sm={24} md={24} lg={19} className="mobile-visor">
                            <Row>
                                <Col xs={24} sm={24} md={24} lg={24} className="mobile-toolBar mobile-position" id="topToolBar">
                                    <div className="mobile-tools" onClick={this.state.fullScreen ? this.closeFullScreen : this.fullScreen}><ImgFull /></div>
                                </Col>
                                <Col xs={24} sm={24} md={24} lg={24} className="mobile-display" style={{ height: this.state.visorHeight }}>
                                    {ecg}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    {this.state.menuInfoPatient ? this.getMenuInfoPatient() : null}
                    {this.state.menuReportPdf ? this.getPdfMobile() : null}
                    {this.state.menuAttachments ? this.getMenuInfoAttachments() : null}
                    {/* {this.getResolutionSeries()} */}
                    {this.getMenuPdf()}
                </div>
            );
        }
        return (
            <div className="loading">
                <img src="/assets/img/loading.gif" width="64" height="64" alt="loading" />
            </div>
        );
    
    }
} export default injectIntl(VisorMain);
