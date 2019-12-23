import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatProgressSpinnerModule, MatRadioModule, MatSliderModule, MatProgressBarModule, MatSlideToggleModule,
  MatFormFieldModule, MatDialogModule, MatInputModule} from '@angular/material';
import { MatVideoModule } from 'mat-video';
import { HttpClientModule } from '@angular/common/http'
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { UploadComponent } from './upload/upload.component';
import { MainComponent } from './main/main.component';
import { ViewFileComponent } from './view-file/view-file.component';
import {AngularFileViewerModule} from '@taldor-ltd/angular-file-viewer';
import { ViewPortalComponent } from './view-portal/view-portal.component';
import {ToastrModule} from 'ngx-toastr';
import { AnonymousComponent } from './anonymous/anonymous.component';
import { AboutComponent } from './about/about.component';
import { DevComponent } from './dev/dev.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { FileIndexComponent } from './file-index/file-index.component';
import { IndImmChanPostViewerComponent } from './ind-imm-chan-post-viewer/ind-imm-chan-post-viewer.component';
import { CatalogComponent } from './catalog/catalog.component';
import { BoardsComponent } from './boards/boards.component';
import { SafePipe } from './safe.pipe';
import { ConfirmEncryptPostComponent } from './confirm-encrypt-post/confirm-encrypt-post.component';
import { TipDialogComponent } from './tip-dialog/tip-dialog.component';
import { ModeratorDialogComponent } from './moderator-dialog/moderator-dialog.component';
import { ThreadFilterPipe } from './thread-filter.pipe';
import { EncodeURIPipe } from './encode-uri.pipe';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CreateBoardComponent } from './create-board/create-board.component';

@NgModule({
  declarations: [
    AppComponent,
    UploadComponent,
    MainComponent,
    ViewFileComponent,
    ViewPortalComponent,
    AnonymousComponent,
    AboutComponent,
    DevComponent,
    ConfirmDialogComponent,
    FileIndexComponent,
    IndImmChanPostViewerComponent,
    CatalogComponent,
    BoardsComponent,
    SafePipe,
    ConfirmEncryptPostComponent,
    TipDialogComponent,
    ModeratorDialogComponent,
    ThreadFilterPipe,
    EncodeURIPipe,
    CreateBoardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule, MatRadioModule, MatSliderModule, MatProgressBarModule, MatSlideToggleModule,
    MatFormFieldModule, MatDialogModule, MatInputModule, MatVideoModule,
    ToastrModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    AngularFileViewerModule,
    HttpClientModule,
    NgxFileDropModule
  ],
  entryComponents: [ConfirmDialogComponent, ConfirmEncryptPostComponent, TipDialogComponent, ModeratorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
