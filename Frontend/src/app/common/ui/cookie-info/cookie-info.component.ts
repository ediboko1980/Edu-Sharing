import {Component, Input, Output, EventEmitter, OnInit, SimpleChanges} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {SessionStorageService} from '../../services/session-storage.service';
import {DialogButton} from '../modal-dialog/modal-dialog.component';
import {UIAnimation} from '../ui-animation';
import {trigger} from '@angular/animations';
import {CordovaService} from "../../services/cordova.service";

@Component({
  selector: 'cookie-info',
  templateUrl: 'cookie-info.component.html',
  styleUrls: ['cookie-info.component.scss'],
    animations: [
        trigger('fromBottom', UIAnimation.fromBottom(UIAnimation.ANIMATION_TIME_SLOW)),
    ]
})


export class CookieInfoComponent{
  show=false;
  dialog=false;
  buttons : DialogButton[];
  constructor(private storage : SessionStorageService,private cordova : CordovaService) {
    this.show=!this.cordova.isRunningCordova() && !this.storage.getCookie("COOKIE_INFO_ACCEPTED",false);
    this.buttons=[new DialogButton('CLOSE',DialogButton.TYPE_PRIMARY,()=>{this.dialog=false;})];
  }
  accept(){
    this.storage.setCookie("COOKIE_INFO_ACCEPTED",true+"");
    this.show=false;
  }
}
