
import React, { useContext, useState, DragEvent } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigItem, Page, NavConfig } from '../types';

const ConfigItemWidget: React.FC<{ item: ConfigItem; sectionTitle: string }> = ({ item, sectionTitle }) => {
    const { updateConfig } = useContext(AppContext);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value: any;
        if (item.type === 'boolean') {
            value = (e.target as HTMLInputElement).checked;
        } else if (item.type === 'number') {
            value = parseInt(e.target.value, 10);
        } else {
            value = e.target.value;
        }
        updateConfig(sectionTitle, item.name, value);
    };

    if (item.type === 'nav_config') {
        return <NavConfigWidget config={item.value} updateConfig={(newConfig) => updateConfig(sectionTitle, item.name, newConfig)} />;
    }

    const renderInput = () => {
        switch (item.name) {
            case 'Dark Mode':
                return (
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={item.value} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                );
            case 'Reminder Time (minutes)':
                return <input type="number" value={item.value} onChange={handleChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-right" />;
            default:
                if (item.type === 'boolean') {
                     return (
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={item.value} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    );
                }
                return null;
        }
    };

    return (
        <div className="flex justify-between items-center py-3">
            <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
            <div className="w-1/2 md:w-1/3 flex justify-end">
                {renderInput()}
            </div>
        </div>
    );
};

const NavConfigWidget: React.FC<{ config: NavConfig, updateConfig: (newConfig: NavConfig) => void }> = ({ config, updateConfig }) => {
    const [draggedItem, setDraggedItem] = useState<Page | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, item: Page) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetList: 'visible' | 'hidden') => {
        e.preventDefault();
        if (!draggedItem) return;

        const newConfig = { ...config };
        
        // Remove from both lists
        newConfig.visible = newConfig.visible.filter(p => p !== draggedItem);
        newConfig.hidden = newConfig.hidden.filter(p => p !== draggedItem);

        // Add to the target list
        if (targetList === 'visible') {
            newConfig.visible.push(draggedItem);
        } else {
            newConfig.hidden.push(draggedItem);
        }
        
        updateConfig(newConfig);
        setDraggedItem(null);
    };

    return (
        <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
                <h3 className="font-semibold mb-2 text-center">Visible Items</h3>
                <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'visible')}
                    className="p-2 min-h-[200px] bg-slate-100 dark:bg-slate-700 rounded-md space-y-2"
                >
                    {config.visible.map(page => (
                        <div 
                            key={page}
                            draggable
                            onDragStart={(e) => handleDragStart(e, page)}
                            className="p-2 bg-white dark:bg-slate-600 rounded shadow-sm cursor-grab active:cursor-grabbing"
                        >
                            {page}
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="font-semibold mb-2 text-center">Hidden Items</h3>
                <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'hidden')}
                    className="p-2 min-h-[200px] bg-slate-100 dark:bg-slate-700 rounded-md space-y-2"
                >
                    {config.hidden.map(page => (
                        <div 
                            key={page}
                            draggable
                            onDragStart={(e) => handleDragStart(e, page)}
                            className="p-2 bg-white dark:bg-slate-600 rounded shadow-sm cursor-grab active:cursor-grabbing"
                        >
                            {page}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const AccountSection: React.FC = () => {
    const { isLoggedIn, username, logout, setLoginModalOpen } = useContext(AppContext);
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Account</h2>
            {isLoggedIn ? (
                <div className="flex justify-between items-center py-3">
                    <span className="text-slate-700 dark:text-slate-300">Logged in as: <span className="font-medium">{username}</span></span>
                    <button 
                        onClick={logout}
                        className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <div className="flex justify-between items-center py-3">
                    <span className="text-slate-700 dark:text-slate-300">You are not logged in.</span>
                     <button 
                        onClick={() => setLoginModalOpen(true)}
                        className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Login
                    </button>
                </div>
            )}
        </div>
    );
};


const ConfigPage: React.FC = () => {
    const { configs } = useContext(AppContext);

    return (
        <div className="p-4">
            <header className="mb-4">
                <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Settings</h1>
            </header>
            <div className="space-y-6">
                <AccountSection />
                {configs.map(section => (
                    <div key={section.title} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">{section.title}</h2>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                           {section.items.map(item => <ConfigItemWidget key={item.name} item={item} sectionTitle={section.title}/>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConfigPage;