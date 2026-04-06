import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

const SortableTaskCard = ({ task, onGoalComplete, isReadOnly, isAdmin, onAwardPoints }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Prevent scrolling while dragging on touch devices
        marginBottom: '1rem'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                onGoalComplete={onGoalComplete}
                isReadOnly={isReadOnly}
                isAdmin={isAdmin}
                onAwardPoints={onAwardPoints}
            />
        </div>
    );
};

export default SortableTaskCard;
