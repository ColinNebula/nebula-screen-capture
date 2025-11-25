import{_ as e,C as t,r as s,S as n,c as r,F as i}from"./firebase-core-Dgf3ZnmO.js";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const o="firebasestorage.googleapis.com";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class a extends i{constructor(e,t,s=0){super(_(e),`Firebase Storage: ${t} (${_(e)})`),this.status_=s,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,a.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return _(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}\n${this.customData.serverResponse}`:this.message=this._baseMessage}}var c,l,u,h;function _(e){return"storage/"+e}function d(e){return new a(c.INVALID_ARGUMENT,e)}function p(){return new a(c.APP_DELETED,"The Firebase app was deleted.")}(l=c||(c={})).UNKNOWN="unknown",l.OBJECT_NOT_FOUND="object-not-found",l.BUCKET_NOT_FOUND="bucket-not-found",l.PROJECT_NOT_FOUND="project-not-found",l.QUOTA_EXCEEDED="quota-exceeded",l.UNAUTHENTICATED="unauthenticated",l.UNAUTHORIZED="unauthorized",l.UNAUTHORIZED_APP="unauthorized-app",l.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",l.INVALID_CHECKSUM="invalid-checksum",l.CANCELED="canceled",l.INVALID_EVENT_NAME="invalid-event-name",l.INVALID_URL="invalid-url",l.INVALID_DEFAULT_BUCKET="invalid-default-bucket",l.NO_DEFAULT_BUCKET="no-default-bucket",l.CANNOT_SLICE_BLOB="cannot-slice-blob",l.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",l.NO_DOWNLOAD_URL="no-download-url",l.INVALID_ARGUMENT="invalid-argument",l.INVALID_ARGUMENT_COUNT="invalid-argument-count",l.APP_DELETED="app-deleted",l.INVALID_ROOT_OPERATION="invalid-root-operation",l.INVALID_FORMAT="invalid-format",l.INTERNAL_ERROR="internal-error",l.UNSUPPORTED_ENVIRONMENT="unsupported-environment";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class m{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return 0===this.path.length}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let s;try{s=m.makeFromUrl(e,t)}catch(r){return new m(e,"")}if(""===s.path)return s;throw n=e,new a(c.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.");var n}static makeFromUrl(e,t){let s=null;const n="([A-Za-z0-9.\\-_]+)";const r=new RegExp("^gs://"+n+"(/(.*))?$","i");function i(e){e.path_=decodeURIComponent(e.path)}const l=t.replace(/[.]/g,"\\."),u=[{regex:r,indices:{bucket:1,path:3},postModify:function(e){"/"===e.path.charAt(e.path.length-1)&&(e.path_=e.path_.slice(0,-1))}},{regex:new RegExp(`^https?://${l}/v[A-Za-z0-9_]+/b/${n}/o(/([^?#]*).*)?$`,"i"),indices:{bucket:1,path:3},postModify:i},{regex:new RegExp(`^https?://${t===o?"(?:storage.googleapis.com|storage.cloud.google.com)":t}/${n}/([^?#]*)`,"i"),indices:{bucket:1,path:2},postModify:i}];for(let o=0;o<u.length;o++){const t=u[o],n=t.regex.exec(e);if(n){const e=n[t.indices.bucket];let r=n[t.indices.path];r||(r=""),s=new m(e,r),t.postModify(s);break}}if(null==s)throw function(e){return new a(c.INVALID_URL,"Invalid URL '"+e+"'.")}(e);return s}}class g{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function f(e,t,s,n){if(n<t)throw d(`Invalid value for '${e}'. Expected ${t} or greater.`);if(n>s)throw d(`Invalid value for '${e}'. Expected ${s} or less.`)}(h=u||(u={}))[h.NO_ERROR=0]="NO_ERROR",h[h.NETWORK_ERROR=1]="NETWORK_ERROR",h[h.ABORT=2]="ABORT";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class R{constructor(e,t,s,n,r,i,o,a,c,l,u,h=!0,_=!1){this.url_=e,this.method_=t,this.headers_=s,this.body_=n,this.successCodes_=r,this.additionalRetryCodes_=i,this.callback_=o,this.errorCallback_=a,this.timeout_=c,this.progressCallback_=l,this.connectionFactory_=u,this.retry=h,this.isUsingEmulator=_,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((e,t)=>{this.resolve_=e,this.reject_=t,this.start_()})}start_(){const e=(e,t)=>{if(t)return void e(!1,new E(!1,null,!0));const s=this.connectionFactory_();this.pendingConnection_=s;const n=e=>{const t=e.loaded,s=e.lengthComputable?e.total:-1;null!==this.progressCallback_&&this.progressCallback_(t,s)};null!==this.progressCallback_&&s.addUploadProgressListener(n),s.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{null!==this.progressCallback_&&s.removeUploadProgressListener(n),this.pendingConnection_=null;const t=s.getErrorCode()===u.NO_ERROR,r=s.getStatus();if(!t||
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function(e,t){const s=e>=500&&e<600,n=-1!==[408,429].indexOf(e),r=-1!==t.indexOf(e);return s||n||r}(r,this.additionalRetryCodes_)&&this.retry){const t=s.getErrorCode()===u.ABORT;return void e(!1,new E(!1,null,t))}const i=-1!==this.successCodes_.indexOf(r);e(!0,new E(i,s))})},t=(e,t)=>{const s=this.resolve_,n=this.reject_,r=t.connection;if(t.wasSuccessCode)try{const e=this.callback_(r,r.getResponse());void 0!==e?s(e):s()}catch(i){n(i)}else if(null!==r){const e=new a(c.UNKNOWN,"An unknown error occurred, please check the error payload for server response.");e.serverResponse=r.getErrorText(),this.errorCallback_?n(this.errorCallback_(r,e)):n(e)}else if(t.canceled){n(this.appDelete_?p():new a(c.CANCELED,"User canceled the upload/download."))}else{n(new a(c.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again."))}};this.canceled_?t(0,new E(!1,null,!0)):this.backoffId_=function(e,t,s){let n=1,r=null,i=null,o=!1,a=0;function c(){return 2===a}let l=!1;function u(...e){l||(l=!0,t.apply(null,e))}function h(t){r=setTimeout(()=>{r=null,e(d,c())},t)}function _(){i&&clearTimeout(i)}function d(e,...t){if(l)return void _();if(e)return _(),void u.call(null,e,...t);if(c()||o)return _(),void u.call(null,e,...t);let s;n<64&&(n*=2),1===a?(a=2,s=0):s=1e3*(n+Math.random()),h(s)}let p=!1;function m(e){p||(p=!0,_(),l||(null!==r?(e||(a=2),clearTimeout(r),h(0)):e||(a=1)))}return h(0),i=setTimeout(()=>{o=!0,m(!0)},s),m}(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,null!==this.backoffId_&&(0,this.backoffId_)(!1),null!==this.pendingConnection_&&this.pendingConnection_.abort()}}class E{constructor(e,t,s){this.wasSuccessCode=e,this.connection=t,this.canceled=!!s}}function k(e,t,s,n,r,i,o=!0,a=!1){const c=function(e){const t=encodeURIComponent;let s="?";for(const n in e)e.hasOwnProperty(n)&&(s=s+(t(n)+"=")+t(e[n])+"&");return s=s.slice(0,-1),s}(e.urlParams),l=e.url+c,u=Object.assign({},e.headers);return function(e,t){t&&(e["X-Firebase-GMPID"]=t)}(u,t),function(e,t){null!==t&&t.length>0&&(e.Authorization="Firebase "+t)}(u,s),function(e,t){e["X-Firebase-Storage-Version"]="webjs/"+(t??"AppManager")}(u,i),function(e,t){null!==t&&(e["X-Firebase-AppCheck"]=t)}(u,n),new R(l,e.method,u,e.body,e.successCodes,e.additionalRetryCodes,e.handler,e.errorHandler,e.timeout,e.progressCallback,r,o,a)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class T{constructor(e,t){this._service=e,this._location=t instanceof m?t:m.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new T(e,t)}get root(){const e=new m(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return function(e){const t=e.lastIndexOf("/",e.length-2);return-1===t?e:e.slice(t+1)}(this._location.path)}get storage(){return this._service}get parent(){const e=function(e){if(0===e.length)return null;const t=e.lastIndexOf("/");return-1===t?"":e.slice(0,t)}(this._location.path);if(null===e)return null;const t=new m(this._location.bucket,e);return new T(this._service,t)}_throwIfRoot(e){if(""===this._location.path)throw function(e){return new a(c.INVALID_ROOT_OPERATION,"The operation '"+e+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}(e)}}function I(e,t){const s=null==t?void 0:t.storageBucket;return null==s?null:m.makeFromBucketSpec(s,e)}class b{constructor(e,t,s,n,r,i=!1){this.app=e,this._authProvider=t,this._appCheckProvider=s,this._url=n,this._firebaseVersion=r,this._isUsingEmulator=i,this._bucket=null,this._host=o,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=12e4,this._maxUploadRetryTime=6e5,this._requests=new Set,this._bucket=null!=n?m.makeFromBucketSpec(n,this._host):I(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,null!=this._url?this._bucket=m.makeFromBucketSpec(this._url,e):this._bucket=I(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){f("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){f("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(null!==t)return t.accessToken}return null}async _getAppCheckToken(){if(r(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});if(e){return(await e.getToken()).token}return null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new T(this,e)}_makeRequest(e,t,s,n,r=!0){if(this._deleted)return new g(p());{const i=k(e,this._appId,s,n,t,this._firebaseVersion,r,this._isUsingEmulator);return this._requests.add(i),i.getPromise().then(()=>this._requests.delete(i),()=>this._requests.delete(i)),i}}async makeRequestWithTokens(e,t){const[s,n]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,s,n).getPromise()}}const O="@firebase/storage",N="0.14.0";function C(e,{instanceIdentifier:t}){const s=e.getProvider("app").getImmediate(),r=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return new b(s,r,i,t,n)}e(new t("storage",C,"PUBLIC").setMultipleInstances(!0)),s(O,N,""),s(O,N,"esm2020");
