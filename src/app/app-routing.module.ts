import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { UploadComponent } from './upload/upload.component';
import { ViewFileComponent } from './view-file/view-file.component';
import { ViewPortalComponent } from './view-portal/view-portal.component';
import { AnonymousComponent } from './anonymous/anonymous.component';
import { AboutComponent } from './about/about.component';
import { DevComponent } from './dev/dev.component';
import { FileIndexComponent } from './file-index/file-index.component';
import { IndImmChanPostViewerComponent } from './ind-imm-chan-post-viewer/ind-imm-chan-post-viewer.component';
import { CatalogComponent } from './catalog/catalog.component';
import { BoardsComponent } from './boards/boards.component';
import { CreateBoardComponent } from './create-board/create-board.component';

const routes: Routes = [
   {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full'
  },
  {
    path: 'main',
    component: MainComponent
  },
  {
    path: 'viewPortal',
    component: ViewPortalComponent
  },
  {
    path: 'upload',
    component: UploadComponent
  },
  {
    path: 'viewFile/:txLedger',
    component: ViewFileComponent
  },
  {
    path: 'anonymous',
    component: AnonymousComponent
  },
  {
    path: 'about',
    component: AboutComponent
  }, 
  {
    path: 'dev',
    component: DevComponent
  },
  {
    path: 'fileIndex',
    component: FileIndexComponent
  }, 
  {
    path: 'postViewer/:board/:id',
    component: IndImmChanPostViewerComponent
  }, 
  {
    path: 'catalog/:board',
    component: CatalogComponent
  },
  {
    path: 'boards',
    component: BoardsComponent
  },
  {
    path: 'createBoard',
    component: CreateBoardComponent
  }
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
