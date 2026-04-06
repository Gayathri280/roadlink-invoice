import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'invoice', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'invoice',
    component: InvoiceComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'invoice' }
];
