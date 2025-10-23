
// import { NextApiRequest, NextApiResponse } from 'next'
// import { NextResponse } from 'next/server'
// import axios from "axios";
// import prisma from '@/lib/prisma'
// import _ from "lodash";

// export default async function handle(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'GET') {
//         try {
//             const { users_id, takecare_id } = req.query;

//             if (!users_id || !takecare_id || isNaN(Number(users_id)) || isNaN(Number(takecare_id))) {
//                 return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ถูกต้อง' });
//             }

//             // ดึงตำแหน่งล่าสุด
//             const latestLocation = await prisma.location.findFirst({
//                 where: {
//                     users_id: Number(users_id),
//                     takecare_id: Number(takecare_id),
//                 },
//                 orderBy: {
//                     location_id: 'desc', // เรียงลำดับตาม location_id จากล่าสุด
//                 },
//             });

//             if (!latestLocation) {
//                 return res.status(404).json({ message: 'error', data: 'ไม่พบตำแหน่งล่าสุด' });
//             }

//             return res.status(200).json({
//                 message: 'success',
//                 data: latestLocation,
//             });
//         } catch (error) {
//             console.error("Error:", error);
//             return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
//         }
//     } else {
//         res.setHeader('Allow', ['GET']);
//         res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
//     }
// }
// pages/api/location/getLocation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

type ApiResult =
  | { message: 'success'; data: any }
  | { message: 'error'; data: string };

function asNumber(q: string | string[] | undefined) {
  if (typeof q === 'string' && q.trim() !== '' && !Number.isNaN(Number(q))) {
    return Number(q);
  }
  // ถ้ามาเป็น array ให้ใช้ตัวแรกที่เป็นตัวเลขได้
  if (Array.isArray(q)) {
    const v = q.find((x) => x != null && x.toString().trim() !== '' && !Number.isNaN(Number(x)));
    return v !== undefined ? Number(v) : NaN;
  }
  return NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResult>) {
  // อนุญาตเฉพาะ GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
  }

  // ป้องกัน cache ระหว่าง proxy/CDN
  res.setHeader('Cache-Control', 'no-store');

  try {
    const usersId = asNumber(req.query.users_id);
    const takecareId = asNumber(req.query.takecare_id);

    if (Number.isNaN(usersId) || Number.isNaN(takecareId)) {
      return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ถูกต้อง (users_id/takecare_id ต้องเป็นตัวเลข)' });
    }

    // ดึงตำแหน่งล่าสุดของ user ใน takecare นั้น ๆ
    const latestLocation = await prisma.location.findFirst({
      where: {
        users_id: usersId,
        takecare_id: takecareId,
      },
      orderBy: { location_id: 'desc' }, // หรือใช้ created_at: 'desc' ถ้ามีฟิลด์วันที่
    });

    if (!latestLocation) {
      return res.status(404).json({ message: 'error', data: 'ไม่พบตำแหน่งล่าสุด' });
    }

    return res.status(200).json({ message: 'success', data: latestLocation });
  } catch (err) {
    console.error('[getLocation] error:', err);
    return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
  }
}
