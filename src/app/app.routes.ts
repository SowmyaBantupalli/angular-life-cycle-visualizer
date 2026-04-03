import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { FormsPageComponent } from './pages/forms-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { SettingsPageComponent } from './pages/settings-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'forms', component: FormsPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: '**', redirectTo: '' }
];
