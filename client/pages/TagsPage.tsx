
import React, { useMemo, useContext } from 'react';
import ListWidget, { ListItem } from '../components/ListWidget';
import { AppContext } from '../context/AppContext';

const TagsPage: React.FC = () => {
  const { tasks, tags } = useContext(AppContext);

  const tasksByTag = useMemo(() => {
    const grouped: { [key: string]: ListItem[] } = {};
    
    tags.forEach(tag => {
        grouped[tag] = [];
    });
    
    tasks.forEach(task => {
      task.tags.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push({ type: 'task', data: task });
      });
    });
    
    return Object.entries(grouped).map(([tag, taskItems]) => ({
      type: 'list',
      data: {
        title: `#${tag}`,
        items: taskItems,
        foldable: true,
        defaultFolded: false
      }
    } as ListItem));
  }, [tasks, tags]);

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Tags</h1>
      </header>
      <ListWidget
        title="Tasks by Tag"
        items={tasksByTag}
        foldable={false}
      />
    </div>
  );
};

export default TagsPage;