import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  // 1. รับ "ใบสั่งอาหาร" (req.body) ที่หน้าเว็บส่งมา
  // หน้าเว็บจะส่งมา 3 อย่าง: ไอดีผู้ใช้, ไอดีคนดูแล, และ สถานะ(เปิด/ปิด)
  const { uId, takecare_id, status } = req.body;

  try {
    // 2. สั่ง Prisma (เชฟ) ให้ไปแก้ข้อมูลใน Database
    const updateSafezone = await prisma.safezone.updateMany({
      where: {
        users_id: Number(uId), // ค้นหาจาก user id นี้
        takecare_id: Number(takecare_id), // และ takecare id นี้
      },
      data: {
        status_tracking_on: status, // แก้ค่า status เป็น true หรือ false ตามที่ส่งมา
      },
    });

    // 3. ส่งผลบอกหน้าเว็บว่า "เสร็จแล้วครับ"
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error" });
  }
}
