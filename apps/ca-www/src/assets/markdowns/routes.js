import { DocumentationComponent } from '@www/views/documentation/documentation/documentation.component';
import { DocsPreviewComponent } from '@www/views/documentation/docs-preview/docs-preview.component';

export const routes = [
  { path: '', component: DocumentationComponent },
  { path: 'formatting-case-management-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'formatting-user-case-assignments-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'formatting-user-management-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'how-admin-manage-user-assignments-to-cases', component: DocsPreviewComponent },
  { path: 'how-admins-manage-cases', component: DocsPreviewComponent },
  { path: 'how-admins-manage-users', component: DocsPreviewComponent },
  { path: 'how-to-assign-modify-or-remove-user-assignments-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'how-to-assign-or-remove-user-assignments-with-existing-cases', component: DocsPreviewComponent },
  { path: 'how-to-assign-users-while-creating-a-case', component: DocsPreviewComponent },
  { path: 'how-to-auto-assign-users-with-the-public-signup-link', component: DocsPreviewComponent },
  { path: 'how-to-auto-create-cases-with-a-public-signup-link', component: DocsPreviewComponent },
  { path: 'how-to-create-an-app', component: DocsPreviewComponent },
  { path: 'how-to-create-and-modify-users-with-the-ui', component: DocsPreviewComponent },
  { path: 'how-to-create-or-modify-cases-through-the-ui-menu', component: DocsPreviewComponent },
  { path: 'how-to-create-or-modify-cases-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'how-to-create-or-modify-users-with-the-import-tool', component: DocsPreviewComponent },
  { path: 'how-to-create-users-with-a-signup-link', component: DocsPreviewComponent },
  { path: 'how-to-log-in', component: DocsPreviewComponent },
  { path: 'how-to-update-a-user-profile', component: DocsPreviewComponent },
  { path: 'how-users-create-a-new-account', component: DocsPreviewComponent }
];
