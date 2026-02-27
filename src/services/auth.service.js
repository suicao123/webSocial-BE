const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function authUser(username, password) {
    try {
        const user = await prisma.users.findUnique({
            where: {
                username: username
            }
        });

        if(!user) {
            return null;
        }

        // const isMatchPass = await bcrypt.compare(password, user.password_hash);
        const isMatchPass = password == user.password_hash;

        if(!isMatchPass) {
            return null;
        }

        return user;
    }
    catch (error) {
        return null;
    }

}

async function calculateGrowth(model, whereCondition = {}) {
    // 1. Lấy ngày đầu tháng hiện tại và đầu tháng trước
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // 2. Đếm tổng số lượng hiện tại (Total)
    const totalCount = await model.count({
        where: whereCondition
    });

    // 3. Đếm số lượng của tháng trước (Để lấy mốc so sánh)
    // Logic: Lấy tổng số bản ghi được tạo TRƯỚC ngày đầu tháng này
    const countBeforeThisMonth = await model.count({
        where: {
            ...whereCondition,
            created_at: {
                lt: firstDayCurrentMonth 
            }
        }
    });

    // Logic: Lấy tổng số bản ghi được tạo TRƯỚC ngày đầu tháng trước
    const countBeforeLastMonth = await model.count({
        where: {
            ...whereCondition,
            created_at: {
                lt: firstDayLastMonth
            }
        }
    });

    // Số lượng tạo ra TRONG tháng trước (Đây là mốc 100%)
    const countInLastMonth = countBeforeThisMonth - countBeforeLastMonth;
    
    // Số lượng tạo ra TRONG tháng này (Giá trị thực đạt được)
    const countInCurrentMonth = totalCount - countBeforeThisMonth;

    // --- PHẦN SỬA ĐỔI: TÍNH TỶ LỆ HOÀN THÀNH ---
    let achievementRate = 0;

    if (countInLastMonth > 0) {
        // Công thức mới: (Tháng này / Tháng trước) * 100
        // Ví dụ: Tháng này 11, Tháng trước 10 => (11/10)*100 = 110%
        achievementRate = (countInCurrentMonth / countInLastMonth) * 100;
    } else {
        // Trường hợp tháng trước = 0
        // Nếu tháng này có dữ liệu (>0) thì coi như đạt 100% (hoặc hiển thị là Mới)
        // Nếu tháng này cũng = 0 thì là 0%
        achievementRate = countInCurrentMonth > 0 ? 100 : 0;
    }

    return {
        total: totalCount,
        // Đổi tên key hoặc giữ nguyên tùy bạn, nhưng giá trị giờ là % hoàn thành (luôn dương)
        growth_percentage: parseFloat(achievementRate.toFixed(1)) 
    };
}

module.exports = {
    authUser,
    calculateGrowth
}
