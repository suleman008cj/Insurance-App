import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrap">
        <TopBar />
        <div className="content-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
