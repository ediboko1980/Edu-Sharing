import {UIAnimation} from "../ui-animation";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {trigger} from "@angular/animations";
import {Node, NodeList, NodePermissions, Permissions} from "../../rest/data-object";
import {RestNodeService} from "../../rest/services/rest-node.service";
import {ConfigurationService} from "../../services/configuration.service";
import {RestHelper} from "../../rest/rest-helper";
import {ConfigurationHelper} from "../../rest/configuration-helper";
import {Router} from "@angular/router";
import {UIConstants} from "../ui-constants";
import {RestConstants} from "../../rest/rest-constants";
import {Toast} from "../toast";


@Component({
  selector: 'node-info',
  templateUrl: 'node-info.component.html',
  styleUrls: ['node-info.component.scss'],
  animations: [
      trigger('fade', UIAnimation.fade()),
      trigger('cardAnimation', UIAnimation.cardAnimation())
  ]
})
/**
 * A node info dialog (useful primary for admin stuff)
 */
export class NodeInfoComponent{
    _path: Node[];
    _children: Node[];
    _permissions: Permissions;
    _node : Node;
    _properties : any[];
    _creator: string;
    _json: string;
    saving: boolean;
    customProperty:string[]=[];
  @Input() set node(node : Node){
    this._node=node;
    this._creator=ConfigurationHelper.getPersonWithConfigDisplayName(this._node.createdBy,this.config);
    this._json=JSON.stringify(this._node,null,4);
    this._properties=[];
    for(let k of Object.keys(node.properties).sort()) {
      if(node.properties[k].join(""))
        this._properties.push([k, node.properties[k].join(", ")]);
    }
    this.nodeApi.getNodeParents(this._node.ref.id,true).subscribe((data:NodeList)=>{
      this._path=data.nodes.reverse();
    });
    this.nodeApi.getChildren(this._node.ref.id,[RestConstants.FILTER_SPECIAL],{propertyFilter:[RestConstants.ALL],count:RestConstants.COUNT_UNLIMITED}).subscribe((data:NodeList)=>{
      this._children=data.nodes;
    });
    this.nodeApi.getNodePermissions(this._node.ref.id,).subscribe((data)=>{
        this._permissions=data.permissions;
    });
  }
  @Output() onClose = new EventEmitter();
  editMode: boolean;
  constructor(private nodeApi : RestNodeService,
              private toast : Toast,
              private config : ConfigurationService,
              private router : Router){}

  close(){
    this.onClose.emit();
  }
  openNode(node:Node){
    this._path=null;
    this._children=null;
    this.node=node;
  }
  openNodeWorkspace(node:Node){
    this.router.navigate([UIConstants.ROUTER_PREFIX,"workspace"],{queryParams:{id:node.parent.id,file:node.ref.id}});
    this.close();
  }
  openBreadcrumb(pos:number){
    let node=this._path[pos-1];
    this._path=null;
    this._children=null;
    this.node=node;
    //this.router.navigate([UIConstants.ROUTER_PREFIX,"workspace"],{queryParams:{id:node.ref.id}});
    //this.close();
  }

  canEdit() {
    return this._node && this._node.access.indexOf(RestConstants.ACCESS_WRITE)!=-1;
  }

  saveEdits() {
    let props:any={};
    for(let prop of this._properties){
      props[prop[0]]=prop[1].split(", ");
    }
    if(this.customProperty[0]){
      props[this.customProperty[0]]=this.customProperty[1] ? this.customProperty[1].split(", ") : '';
    }
    this.saving=true;
    this.nodeApi.editNodeMetadata(this._node.ref.id,props,this._node.ref.repo).subscribe(()=>{
      this.nodeApi.getNodeMetadata(this._node.ref.id,[RestConstants.ALL],this._node.ref.repo).subscribe((node)=>{
        this.saving=false;
        this.customProperty=[];
        this.editMode=false;
        this.openNode(node.node);
      });
    },(error)=>{
      this.toast.error(error);
      this.saving=false;
    })
  }
}
