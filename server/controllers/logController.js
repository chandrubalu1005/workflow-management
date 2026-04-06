import { ActivityLog } from '../models/index.js';

export const getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', action = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const query = {};

        if (action && action !== 'all') {
            query.action = { $regex: action, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { 'user.name': { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const sortDir = sortOrder === 'asc' ? 1 : -1;
        const validSortFields = ['createdAt', 'action', 'user.name'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

        if (sortField === 'user.name') {
            const pipeline = [
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
                { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
                { $match: query },
                { $sort: { 'userDetails.name': sortDir, createdAt: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) }
            ];
            const logsResult = await ActivityLog.aggregate(pipeline);
            
            const countPipeline = [
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
                { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
                { $match: query },
                { $count: 'count' }
            ];
            const totalResult = await ActivityLog.aggregate(countPipeline);
            const total = totalResult.length > 0 ? totalResult[0].count : 0;
            
            const logs = logsResult.map(log => ({
                ...log,
                user: log.userDetails || null
            }));

            return res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
        } else {
            // Normal fallback for direct fields
            const sortObj = { [sortField]: sortDir };
            const [logs, total] = await Promise.all([
                ActivityLog.find(query).populate('user', 'name email role').sort(sortObj).skip(skip).limit(parseInt(limit)),
                ActivityLog.countDocuments(query)
            ]);
            return res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
        }
    } catch (error) {
        console.error('Log fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch logs' });
    }
};
