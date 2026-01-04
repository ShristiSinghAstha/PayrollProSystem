import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const BaseLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="ml-64">
                <TopBar />
                <main className="pt-16">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default BaseLayout;
