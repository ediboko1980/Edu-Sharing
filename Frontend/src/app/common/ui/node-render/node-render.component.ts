import {
    Component, OnInit, OnDestroy, Input, EventEmitter, Output, ViewChild, ElementRef,
    HostListener, ChangeDetectorRef, ApplicationRef, NgZone, ComponentFactoryResolver, ViewContainerRef, EmbeddedViewRef
} from '@angular/core';
import {RestConnectorService} from "../../rest/services/rest-connector.service";
import {RestConstants} from "../../rest/rest-constants";
import {
    NodeList,
    Node,
    NodeWrapper,
    LoginResult,
    ConnectorList,
    CollectionUsage,
    Collection
} from "../../rest/data-object";
import {Toast} from "../toast";
import {RestNodeService} from "../../rest/services/rest-node.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import {Translation} from "../../translation";
import {TemporaryStorageService} from "../../services/temporary-storage.service";
import {OptionItem} from "../actionbar/option-item";
import {UIAnimation} from "../ui-animation";
import {FrameEventsService} from "../../services/frame-events.service";
import {UIHelper} from "../ui-helper";
import {ConfigurationService} from "../../services/configuration.service";
import {Title} from "@angular/platform-browser";
import {SessionStorageService} from "../../services/session-storage.service";
import {RestConnectorsService} from "../../rest/services/rest-connectors.service";
import {trigger} from "@angular/animations";
import {Location} from "@angular/common";
import {NodeHelper} from "../node-helper";
import {RestToolService} from "../../rest/services/rest-tool.service";
import {UIConstants} from "../ui-constants";
import {ConfigurationHelper} from "../../rest/configuration-helper";
import {SearchService} from "../../../modules/search/search.service";
import {Helper} from "../../helper";
import {RestHelper} from "../../rest/rest-helper";
import {EventListener} from "../../../common/services/frame-events.service";
import {ActionbarHelperService} from "../../services/actionbar-helper";
import {SuggestItem} from "../autocomplete/autocomplete.component";
import {MainNavComponent} from "../main-nav/main-nav.component";
import {RestSearchService} from '../../rest/services/rest-search.service';
import {RestMdsService} from '../../rest/services/rest-mds.service';
import {MdsHelper} from '../../rest/mds-helper';
import {HttpClient} from "@angular/common/http";
import {RestIamService} from "../../rest/services/rest-iam.service";
import {SpinnerComponent} from "../spinner/spinner.component";
import {ListTableComponent} from "../list-table/list-table.component";
import {RestUsageService} from "../../rest/services/rest-usage.service";
import {ListItem} from "../list-item";
import {CommentsListComponent} from "../../../modules/management-dialogs/node-comments/comments-list/comments-list.component";

declare var jQuery:any;
declare var window: any;

@Component({
  selector: 'node-render',
  templateUrl: 'node-render.component.html',
  styleUrls: ['node-render.component.scss'],
  animations: [
    trigger('fadeFast', UIAnimation.fade(UIAnimation.ANIMATION_TIME_FAST))
  ]
})


export class NodeRenderComponent implements EventListener{


  public isLoading=true;
  public isBuildingPage=false;
  /**
   * Show a bar at the top with the node name or not
   * @type {boolean}
   */
  @Input() showTopBar=true;
  /**
   * Node version, -1 indicates the latest
   * @type {string}
   */
  @Input() version=RestConstants.NODE_VERSION_CURRENT;
  /**
   *   display metadata
   */
  @Input() metadata=true;
  private isRoute = false;
  private options: OptionItem[]=[];
  private list: Node[];
  private isSafe=false;
  private isOpenable: boolean;
  private closeOnBack: boolean;
  public nodeMetadata: Node;
  public nodeShare: Node;
  public nodeShareLink: Node;
  public nodeWorkflow: Node;
  public addNodesStream: Node[];
  public nodeDelete: Node[];
  public nodeVariant: Node;
  public addToCollection: Node[];
  public nodeReport: Node;
  private editor: string;
  private fromLogin = false;
  public banner: any;
  private repository: string;
  private downloadButton: OptionItem;
  private downloadUrl: string;
  sequence: NodeList;
  sequenceParent: Node;
  canScrollLeft: boolean = false;
  canScrollRight: boolean = false;
  private queryParams: Params;
  public similarNodes: Node[];

  @ViewChild('sequencediv') sequencediv : ElementRef;
  @ViewChild('mainNav') mainNavRef : MainNavComponent;
  isChildobject = false;


    public static close(location:Location) {
        location.back();
    }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event:any) {
    if(this.isSafe){
      this.connector.logoutSync();
    }
  }
  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
      this.setScrollparameters();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(this.nodeMetadata!=null) {
      return;
    }
    if (event.code == "ArrowLeft" && this.canSwitchBack()) {
      this.switchPosition(this.getPosition() - 1);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.code == "ArrowRight" && this.canSwitchForward()) {
        this.switchPosition(this.getPosition() + 1);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

  }
    _node : Node;
    private _nodeId : string;
    @Input() set node(node: Node|string){
      let id=(node as Node).ref ? (node as Node).ref.id : (node as string);
      jQuery('#nodeRenderContent').html('');
      this._nodeId=id;
      this.loadRenderData();
    }
    @Output() onClose=new EventEmitter();
    similarNodeColumns: ListItem[]=[];
    private close(){
      if(this.isRoute) {
        if(this.closeOnBack){
          window.close();
        }
        else {
          if(this.fromLogin){
            this.router.navigate([UIConstants.ROUTER_PREFIX+"workspace"]);
          }
          else {
            if(this.temporaryStorageService.get(TemporaryStorageService.NODE_RENDER_PARAMETER_ORIGIN)=="search") {
                this.searchService.reinit = false;
            }
            NodeRenderComponent.close(this.location);
            // use a timeout to let the browser try to go back in history first
            setTimeout(()=>this.mainNavRef.openSidenav(),250);
          }
        }
      }
      else
        this.onClose.emit();
    }


    private showDetails() {
      let rect=document.getElementById('edusharing_rendering_metadata').getBoundingClientRect();
      if(window.scrollY<rect.top) {
          UIHelper.scrollSmooth(rect.top, 1.5);
      }
    }
    public getPosition(){
      if(!this._node || !this.list)
        return -1;
      let i=0;
      for(let node of this.list){
        if(node.ref.id==this._node.ref.id || node.ref.id==this.sequenceParent.ref.id)
          return i;
        i++;
      }
      return -1;
    }
    onEvent(event: string, data: any): void {
        if(event==FrameEventsService.EVENT_REFRESH){
            this.refresh();
        }
    }
    constructor(
      private translate : TranslateService,
      private location: Location,
      private searchService : SearchService,
      private connector : RestConnectorService,
      private http : HttpClient,
      private connectors : RestConnectorsService,
      private iam : RestIamService,
      private mdsApi : RestMdsService,
      private nodeApi : RestNodeService,
      private searchApi : RestSearchService,
      private usageApi : RestUsageService,
      private searchStorage : SearchService,
      private toolService: RestToolService,
      private componentFactoryResolver: ComponentFactoryResolver,
      private viewContainerRef: ViewContainerRef,
      private frame : FrameEventsService,
      private actionbar : ActionbarHelperService,
      private toast : Toast,
      private cd: ChangeDetectorRef,
      private title : Title,
      private config : ConfigurationService,
      private storage : SessionStorageService,
      private route : ActivatedRoute,
      private _ngZone: NgZone,
      private router : Router,
      private temporaryStorageService: TemporaryStorageService) {
      (window as any)['nodeRenderComponentRef'] = {component: this, zone: _ngZone};
      (window as any).ngRender = {setDownloadUrl:(url:string)=>{this.setDownloadUrl(url)}};
      this.frame.addListener(this);

        Translation.initialize(translate,config,storage,route).subscribe(()=>{
            this.mdsApi.getSet().subscribe((set)=>{
                this.similarNodeColumns = MdsHelper.getColumns(set,'search');
            });
        this.banner = ConfigurationHelper.getBanner(this.config);
        this.connector.setRoute(this.route);
        this.route.queryParams.subscribe((params:Params)=>{
          this.closeOnBack=params['closeOnBack']=='true';
          this.editor=params['editor'];
          this.fromLogin=params['fromLogin']=='true';
          this.repository=params['repository'] ? params['repository'] : RestConstants.HOME_REPOSITORY;
          this.queryParams=params;
          let childobject = params['childobject_id'] ? params['childobject_id'] : null;
          this.isChildobject=childobject!=null;
          this.route.params.subscribe((params: Params) => {
            if(params['node']) {
              this.isRoute=true;
              this.list = this.temporaryStorageService.get(TemporaryStorageService.NODE_RENDER_PARAMETER_LIST);
              this.connector.isLoggedIn().subscribe((data:LoginResult)=>{
                this.isSafe=data.currentScope==RestConstants.SAFE_SCOPE;
                if(params['version']) {
                    this.version = params['version'];
                }
                if(childobject){
                    setTimeout(()=>this.node = childobject,10);
                }
                else {
                    setTimeout(()=>this.node = params['node'],10);
                }
              });
            }
          });
        });

      });
      this.frame.broadcastEvent(FrameEventsService.EVENT_VIEW_OPENED,'node-render');
    }
    ngOnDestroy() {
        (window as any).ngRender = null;
    }

  public switchPosition(pos:number){
    //this.router.navigate([UIConstants.ROUTER_PREFIX+"render",this.list[pos].ref.id]);
    this.isLoading=true;
    this.sequence = null;
    this.node=this.list[pos];
    //this.options=[];
  }
  public canSwitchBack(){
    return this.list && this.getPosition()>0 && !this.list[this.getPosition()-1].isDirectory;
  }
  public canSwitchForward(){
    return this.list && this.getPosition()<this.list.length-1 && !this.list[this.getPosition()+1].isDirectory;
  }
  public closeMetadata(){
    this.nodeMetadata=null;
  }
  public refresh(){
    if(this.isLoading)
      return;
    this.options=[];
    this.isLoading=true;
    this.node=this._nodeId;
  }
  viewParent(){
      this.isChildobject=false;
      this.node=this.sequenceParent;
  }
  viewChildobject(node:Node,pos:number){
        this.isChildobject=true;
        this.node=node;
  }
  private loadNode() {
    if(!this._node) {
        this.isBuildingPage = false;
        return;
    }

    let input=this.temporaryStorageService.get(TemporaryStorageService.NODE_RENDER_PARAMETER_OPTIONS);
    if(!input) input=[];
    let opt:OptionItem[]=[];
    for(let o of input){
      opt.push(o);
    }
    let download=new OptionItem('WORKSPACE.OPTION.DOWNLOAD','cloud_download',()=>this.downloadCurrentNode());
    download.isEnabled=this._node.downloadUrl!=null;
    download.showAsAction=true;
    if(this.isCollectionRef()){
      this.nodeApi.getNodeMetadata(this._node.properties[RestConstants.CCM_PROP_IO_ORIGINAL]).subscribe((node:NodeWrapper)=>{
        this.addDownloadButton(opt,download);
      },(error:any)=>{
        if(error.status==RestConstants.HTTP_NOT_FOUND) {
          console.log("original missing");
          download.isEnabled = false;
        }
        this.addDownloadButton(opt,download);
      });
      return;
    }
    this.addDownloadButton(opt,download);
  }
  private loadRenderData(){
      this.isLoading=true;
      this.options=[];
    if(this.isBuildingPage){
        setTimeout(()=>this.loadRenderData(),50);
        return;
    }
    let parameters={
      showDownloadButton:this.config.instant("rendering.showDownloadButton",false),
      showDownloadAdvice:!this.isOpenable
    };
    this._node=null;
    this.isBuildingPage=true;
    this.nodeApi.getNodeRenderSnippet(this._nodeId,this.version && !this.isChildobject ? this.version : "-1",parameters,this.repository)
        .subscribe((data:any)=>{
            if (!data.detailsSnippet) {
                console.error(data);
                this.toast.error(null,"RENDERSERVICE_API_ERROR");
            }
            else {
                this._node=data.node;
                this.getSequence(()=>{
                    jQuery('#nodeRenderContent').html(data.detailsSnippet);
                    this.postprocessHtml();
                    this.addCollections();
                    this.addComments();
                    this.loadNode();
                    this.isLoading = false;
                });
            }
            this.isLoading = false;
            this.mainNavRef.finishPreloading();
        },(error:any)=>{
            console.log(error);
            this.toast.error(error);
            this.isLoading = false;
            this.mainNavRef.finishPreloading();
        })
  }
    onDelete(event:any){
        if(event.error)
            return;
        this.close();
    }
    addCollections(){
        let domContainer:Element;
        let domCollections:Element;
        try {
            domContainer = document.getElementsByClassName("node_collections_render")[0].parentElement;
            domCollections = document.getElementsByTagName("collections")[0];
        }catch(e){
            console.log("did not find collections rendering template, will not display in collections widget",e);
            return;
        }
        UIHelper.injectAngularComponent(this.componentFactoryResolver,this.viewContainerRef,SpinnerComponent,domCollections);
        this.usageApi.getNodeUsagesCollection(this.isCollectionRef() ? this._node.properties[RestConstants.CCM_PROP_IO_ORIGINAL] : this._node.ref.id,this._node.ref.repo).subscribe((usages)=>{
            //@TODO: This does currently ignore the "hideIfEmpty" flag of the mds template
            if(usages.length==0){
                domContainer.parentElement.removeChild(domContainer);
                return;
            }
            let data={
                nodes:usages.map((u)=>u.collection),
                columns:ListItem.getCollectionDefaults(),
                isClickable:true,
                clickRow:(collection:Node)=>{
                    UIHelper.goToCollection(this.router,collection);
                },
                viewType:ListTableComponent.VIEW_TYPE_GRID_SMALL,
            };
            UIHelper.injectAngularComponent(this.componentFactoryResolver,this.viewContainerRef,ListTableComponent,document.getElementsByTagName("collections")[0],data,250);
        },(error)=>{
            domContainer.parentElement.removeChild(domContainer);
        });
    }
  private addComments(){
      let data={
          node:this._node,
          readOnly:false
      };
      UIHelper.injectAngularComponent(this.componentFactoryResolver,this.viewContainerRef,CommentsListComponent,document.getElementsByTagName("comments")[0],data);
  }
  private postprocessHtml() {
    if(!this.config.instant("rendering.showPreview",true)){
      jQuery('.edusharing_rendering_content_wrapper').hide();
      jQuery('.showDetails').hide();
    }
    if(this.isOpenable){
      jQuery('#edusharing_downloadadvice').hide();
    }
      let element=jQuery('#edusharing_rendering_content_href');
      console.log(element);
      element.click((event:any)=>{
          if(this.connector.getCordovaService().isRunningCordova()){
              let href=element.attr('href');
              console.log(href);
              this.connector.getCordovaService().openBrowser(href);
              event.preventDefault();
          }
      });
  }
  private openLink(href:string){

  }
  private downloadSequence() {
      let nodes = [this.sequenceParent].concat(this.sequence.nodes);
      NodeHelper.downloadNodes(this.toast,this.connector,nodes, this.sequenceParent.name+".zip");
  }

  private downloadCurrentNode() {
      if(this.downloadUrl) {
          NodeHelper.downloadUrl(this.toast, this.connector.getCordovaService(), this.downloadUrl);
      } else {
          NodeHelper.downloadNode(this.toast, this.connector.getCordovaService(), this._node, this.version);
      }
  }

  private openConnector(newWindow=true) {
    if(RestToolService.isLtiObject(this._node)){
      this.toolService.openLtiObject(this._node);
    }
    else {
      UIHelper.openConnector(this.connectors,this.iam,this.frame,this.toast, this._node,null,null,null,newWindow);
    }
  }

  private checkConnector(options:OptionItem[]) {
    this.connector.isLoggedIn().subscribe((login:LoginResult)=>{
        this.connectors.list().subscribe((data:ConnectorList)=>{
            this.initAfterConnector(options,login);
        },(error:any)=>{
            this.initAfterConnector(options,login);
        });
    });
  }

    private initAfterConnector(options:OptionItem[],login: LoginResult) {
        if (!this.isCollectionRef()) {
            if(!this.connector.getCurrentLogin().isGuest) {
                let openFolder = new OptionItem('SHOW_IN_FOLDER', 'folder', () => this.goToWorkspace(login, this._node));
                openFolder.isEnabled = false;
                this.nodeApi.getNodeParents(this._node.parent.id, false, [], this._node.parent.repo).subscribe((data: NodeList) => {
                    openFolder.isEnabled = true;
                });

                if (this._node.type != RestConstants.CCM_TYPE_REMOTEOBJECT && ConfigurationHelper.hasMenuButton(this.config, "workspace"))
                    options.push(openFolder);
            }
            let edit = new OptionItem('WORKSPACE.OPTION.EDIT', 'info_outline', () => this.nodeMetadata = this._node);
            edit.isEnabled = this._node.access.indexOf(RestConstants.ACCESS_WRITE) != -1 && this._node.type != RestConstants.CCM_TYPE_REMOTEOBJECT;
            if (this.version == RestConstants.NODE_VERSION_CURRENT)
                options.push(edit);
            this.isOpenable = false;
        }
        else {
            let openFolder = new OptionItem('SHOW_IN_FOLDER', 'folder', null);
            openFolder.isEnabled = false;
            this.nodeApi.getNodeMetadata(this._node.properties[RestConstants.CCM_PROP_IO_ORIGINAL]).subscribe((original: NodeWrapper) => {

                this.nodeApi.getNodeParents(original.node.parent.id, false, [], original.node.parent.repo).subscribe(() => {
                    openFolder.isEnabled = true;
                    openFolder.callback=() => this.goToWorkspace(login, original.node);
                    //.isEnabled = data.node.access.indexOf(RestConstants.ACCESS_WRITE) != -1;
                });
            }, (error: any) => {
            });
            options.push(openFolder);
        }
        let addCollection = this.actionbar.createOptionIfPossible('ADD_TO_COLLECTION', [this._node], () => this.addToCollection = [this._node]);
        if (addCollection) {
            addCollection.showAsAction = false;
            addCollection.isEnabled = this._node.type != RestConstants.CCM_TYPE_REMOTEOBJECT;
            options.push(addCollection);
        }
        let variant = this.actionbar.createOptionIfPossible('CREATE_VARIANT', [this._node], () => this.nodeVariant = this._node);
        if (variant) {
            options.push(variant);
        }

        let share = this.actionbar.createOptionIfPossible('INVITE', [this._node], (node: Node) => this.nodeShare = this._node);
        if (share) {
            share.showAsAction = false;
            share.isSeperate = true;
            options.push(share);
        }
        let shareLink = this.actionbar.createOptionIfPossible('SHARE_LINK',[this._node],(node: Node) => this.nodeShareLink=this._node);
        if (shareLink && !this.isSafe)
            options.push(shareLink);
        let workflow = this.actionbar.createOptionIfPossible('WORKFLOW', [this._node], (node: Node) => this.nodeWorkflow = this._node);
        if (workflow) {
            options.push(workflow);
        }
        let stream = this.actionbar.createOptionIfPossible('ADD_TO_STREAM',[this._node],(node:Node)=>this.addNodesStream=[this._node]);
        if(stream){
            options.push(stream);
        }
        if (this.config.instant("nodeReport", false)) {
            let nodeReport = new OptionItem('NODE_REPORT.OPTION', 'flag', () => this.nodeReport = this._node);
            options.push(nodeReport);
        }
        let del = this.actionbar.createOptionIfPossible('DELETE', [this._node], (node: Node) => this.nodeDelete = [this._node]);
        if (del) {
            options.push(del);
        }
        this.isOpenable = false;
        if (this.version == RestConstants.NODE_VERSION_CURRENT && this.connectors.connectorSupportsEdit(this._node) || RestToolService.isLtiObject(this._node)) {
            let view = new OptionItem("WORKSPACE.OPTION.VIEW", "launch", () => this.openConnector( true));
            //view.isEnabled = this._node.access.indexOf(RestConstants.ACCESS_WRITE)!=-1;
            options.splice(0, 0, view);
            this.isOpenable = true;
            if (this.editor && this.connectors.connectorSupportsEdit(this._node).id == this.editor) {
                this.openConnector(false);
            }
        }
        let custom=this.config.instant('renderNodeOptions');
        NodeHelper.applyCustomNodeOptions(this.toast,this.http,this.connector,custom,this.searchService.searchResult, this._node ? [this._node] : null, options,(load:boolean)=>this.isLoading=load);

        this.options = Helper.deepCopyArray(options);
        this.postprocessHtml();
        this.isBuildingPage=false;
    }

    private goToWorkspace(login:LoginResult,node:Node) {
      UIHelper.goToWorkspace(this.nodeApi,this.router,login,node);
  }

  private isCollectionRef() {
    return this._node.aspects.indexOf(RestConstants.CCM_ASPECT_IO_REFERENCE)!=-1;
  }

  private addDownloadButton(options:OptionItem[],download: OptionItem) {
      this.nodeApi.getNodeChildobjects(this.sequenceParent.ref.id,this.repository).subscribe((data:NodeList)=>{
          this.downloadButton=download;
          options.splice(0,0,download);
          if(data.nodes.length > 0 || this._node.aspects.indexOf(RestConstants.CCM_ASPECT_IO_CHILDOBJECT) != -1) {
              let downloadAll = new OptionItem('DOWNLOAD_ALL','archive',()=>{
                  this.downloadSequence();
              });
              options.splice(1,0,downloadAll);
          }
          if(this.searchService.reurl) {
              let apply = new OptionItem("APPLY", "redo", (node: Node) => NodeHelper.addNodeToLms(this.router, this.temporaryStorageService, this._node, this.searchService.reurl));
              apply.isEnabled = this._node.access.indexOf(RestConstants.ACCESS_CC_PUBLISH) != -1;
              options.splice(0, 0, apply);
          }
          this.checkConnector(options);

      });
    UIHelper.setTitleNoTranslation(this._node.name,this.title,this.config);
  }
  setDownloadUrl(url:string){
      if(this.downloadButton!=null)
        this.downloadButton.isEnabled=url!=null;
      this.downloadUrl=url;
  }

    private getSequence(onFinish:Function) {
        if(this._node.aspects.indexOf(RestConstants.CCM_ASPECT_IO_CHILDOBJECT) != -1) {
           this.nodeApi.getNodeMetadata(this._node.parent.id).subscribe(data =>{
             this.sequenceParent = data.node;
               this.nodeApi.getNodeChildobjects(this.sequenceParent.ref.id,this.repository).subscribe((data:NodeList)=>{
                   if(data.nodes.length > 0)
                    this.sequence = data;
                    setTimeout(()=>this.setScrollparameters(),100);
                   onFinish();
               });
            });
        } else {
            this.sequenceParent = this._node;
            this.nodeApi.getNodeChildobjects(this.sequenceParent.ref.id,this.repository).subscribe((data:NodeList)=>{
                if(data.nodes.length > 0)
                  this.sequence = data;
                  setTimeout(()=>this.setScrollparameters(),100);
                onFinish();
            });
        }
    }

    private scroll(direction: string) {
        let element = this.sequencediv.nativeElement;
        let width=window.innerWidth/2;
        UIHelper.scrollSmoothElement(element.scrollLeft + (direction=='left' ? -width : width),element,2,'x').then((limit)=>{
            this.setScrollparameters();
        });
    }

    private setScrollparameters() {
      if(!this.sequence)
        return;
      let element = this.sequencediv.nativeElement;
      if(element.scrollLeft <= 20) {
          this.canScrollLeft = false;
      } else {
          this.canScrollLeft = true;
      }
      if((element.scrollLeft + 20) >= (element.scrollWidth - window.innerWidth)) {
          this.canScrollRight = false;
      } else {
          this.canScrollRight = true;
      }
    }
    private getNodeName(node:Node) {
      return RestHelper.getName(node);
    }
    private getNodeTitle(node:Node) {
        return RestHelper.getTitle(node);
    }

    public switchNode(node:Node){
        UIHelper.scrollSmooth();
        this.node=node;
    }
}
