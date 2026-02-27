const transactionRepository = require('../repositories/transactionRepository');
const bookingRepository = require('../repositories/bookingRepository');
const roomRepository = require('../repositories/roomRepository');

const reportService = {
    async getDailySummary(date) {
        const [summary, categories, rooms, pendingResult] = await Promise.all([
            transactionRepository.getDailySummary(date),
            transactionRepository.getDailyCategoryBreakdown(date),
            roomRepository.findAll(),
            transactionRepository.getPendingCount(date),
        ]);

        const occupiedRooms = rooms.filter(r => r.status !== 'available').length;

        // Separate categories
        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const roomIncome = incomeCategories.filter(c => c.category === 'ค่าห้องพัก').reduce((sum, c) => sum + parseFloat(c.total), 0);
        const otherIncome = incomeCategories.filter(c => c.category !== 'ค่าห้องพัก').reduce((sum, c) => sum + parseFloat(c.total), 0);

        return {
            date,
            totalIncome: parseFloat(summary.total_income),
            roomIncome,
            otherIncome,
            totalExpense: parseFloat(summary.total_expense),
            netAmount: parseFloat(summary.total_income) - parseFloat(summary.total_expense),
            transactionCount: parseInt(summary.transaction_count),
            pendingCount: parseInt(pendingResult || 0),
            incomeCategories: incomeCategories.map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) })),
            expenseCategories: expenseCategories.map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) })),
            roomSummary: {
                total: rooms.length,
                occupied: occupiedRooms,
                available: rooms.length - occupiedRooms,
                occupancyRate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0,
            },
        };
    },

    async getMonthlySummary(year, month) {
        const [dailyData, categories] = await Promise.all([
            transactionRepository.getMonthlySummary(year, month),
            transactionRepository.getMonthlyCategoryBreakdown(year, month),
        ]);

        let totalIncome = 0;
        let totalExpense = 0;

        const days = dailyData.map(d => {
            const income = parseFloat(d.total_income);
            const expense = parseFloat(d.total_expense);
            totalIncome += income;
            totalExpense += expense;
            return { date: d.date, income, expense, net: income - expense };
        });

        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const roomIncome = incomeCategories.filter(c => c.category === 'ค่าห้องพัก').reduce((sum, c) => sum + parseFloat(c.total), 0);
        const otherIncome = incomeCategories.filter(c => c.category !== 'ค่าห้องพัก').reduce((sum, c) => sum + parseFloat(c.total), 0);

        return {
            year, month,
            totalIncome, roomIncome, otherIncome,
            totalExpense, netProfit: totalIncome - totalExpense,
            incomeCategories: incomeCategories.map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) })),
            expenseCategories: expenseCategories.map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) })),
            days,
        };
    },

    async getMonthlyPdfData(year, month) {
        const { calculateNights } = require('../utils/helpers');
        const [bookings, transactions, summary, categories] = await Promise.all([
            bookingRepository.findByMonth(year, month),
            transactionRepository.findByMonth(year, month),
            transactionRepository.getMonthlySummary(year, month),
            transactionRepository.getMonthlyCategoryBreakdown(year, month),
        ]);

        // Enrich bookings with nights
        const enrichedBookings = bookings.map(b => ({
            ...b,
            nights: calculateNights(b.check_in_date, b.check_out_date),
        }));

        // Financial totals
        let totalIncome = 0, totalExpense = 0;
        summary.forEach(d => {
            totalIncome += parseFloat(d.total_income);
            totalExpense += parseFloat(d.total_expense);
        });

        const incomeCategories = categories.filter(c => c.type === 'income').map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) }));
        const expenseCategories = categories.filter(c => c.type === 'expense').map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count) }));

        return {
            year, month,
            bookings: enrichedBookings,
            transactions,
            totalIncome, totalExpense,
            netProfit: totalIncome - totalExpense,
            incomeCategories, expenseCategories,
        };
    },
};

module.exports = reportService;
