import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  replyNotification,
  replyNotificationPostback,
  replyLocation,
} from "@/utils/apiLineReply";
import axios from "axios";
import moment from "moment";
import * as api from "@/lib/listAPI";
import { encrypt } from "@/utils/helpers";
import { handleViewLocation } from "@/pages/api/lineProfile";
import { pushLocation } from "@/utils/apiLinePush";

const LINE_PUSH_MESSAGING_API =
  process.env.DRY_RUN === "true"
    ? "https://api.line.me/v2/bot/message/validate/push"
    : "https://api.line.me/v2/bot/message/push";

const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN_LINE}`,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // รองรับทั้ง POST และ PUT
  if (req.method === "PUT" || req.method === "POST") {
    try {
      const { uId, takecare_id, distance, latitude, longitude, battery } =
        req.body;

      // ตรวจสอบพารามิเตอร์ (ปล่อยให้ 0 ผ่านได้)
      if (
        uId === undefined ||
        takecare_id === undefined ||
        distance === undefined ||
        latitude === undefined ||
        longitude === undefined ||
        battery === undefined
      ) {
        return res
          .status(400)
          .json({ message: "error", data: "พารามิเตอร์ไม่ครบถ้วน" });
      }

      // ดึง Safezone พร้อมกับดึงค่า status_tracking_on มาให้ด้วยว่าผู้ใช้เปิดการทำงาน gps tracking มั้ย
      const safezone = await prisma.safezone.findFirst({
        where: {
          takecare_id: Number(takecare_id),
          users_id: Number(uId),
        },
      });

      if (!safezone) {
        return res
          .status(404)
          .json({ message: "error", data: "ไม่พบข้อมูล Safezone" });
      }
      
      const r1 = safezone.safez_radiuslv1;
      const r2 = safezone.safez_radiuslv2;
      const safezoneThreshold = r2 * 0.8; // กำหนดเกณฑ์เตือนที่ 80% ของ r2
      const distNum = Number(distance);
      
      
      // คำนวณสถานะ
      let calculatedStatus = 0;
      if (distNum <= r1) {
        calculatedStatus = 0;
      } else if (distNum > r1 && distNum < safezoneThreshold) {
        calculatedStatus = 1;
      } else if (distNum >= safezoneThreshold && distNum <= r2) {
        calculatedStatus = 3;
      } else if (distNum > r2) {
        calculatedStatus = 2;
      }

      // หาแถวล่าสุดของคู่ users_id + takecare_id
      const latest = await prisma.location.findFirst({
        where: {
          users_id: Number(uId),
          takecare_id: Number(takecare_id),
        },
        orderBy: { locat_timestamp: "desc" },
      });

      // ข้อมูลที่จะบันทึก
      const dataPayload = {
        users_id: Number(uId),
        takecare_id: Number(takecare_id),
        locat_timestamp: new Date(),
        locat_latitude: String(latitude),
        locat_longitude: String(longitude),
        locat_status: calculatedStatus,
        locat_distance: Number(distance),
        locat_battery: Number(battery),
        locat_noti_time: new Date(),
        locat_noti_status: 1,
      };

      // แจ้งเตือน (เหมือนเดิม)
      const user = await prisma.users.findFirst({
        where: { users_id: Number(uId) },
      });
      const takecareperson = await prisma.takecareperson.findFirst({
        where: {
          users_id: Number(uId),
          takecare_id: Number(takecare_id),
          takecare_status: 1,
        },
      });

      // replyToken (LINE user id) ใช้สำหรับส่งข้อความตอบกลับ
      const replyToken = user?.users_line_id || "";
      // กำหนดค่า Default เป็น true ไว้ก่อนเผื่อหาไม่เจอ
      const shouldTrack = safezone?.status_tracking_on ?? true;

      const lat = Number(latitude);
      const long = Number(longitude);

      let stop_em = false;
      let req_view_location = false;

      // 2. เช็คเงื่อนไข: "ต้องรออยู่ (True)" และ "พิกัดต้องไม่ใช่ 0.0"
      if (latest?.is_waiting_for_location === true && lat !== 0 && long !== 0) {
        console.log(
          "🚩 พบ User ที่รอแผนที่จุดเกิดเหตุอยู่ -> กำลังส่ง LINE..."
        );

        // 3. ส่ง LINE แผนที่ตามไป (ใช้ฟังก์ชัน pushLocationToLine หรือ axios)
        if (latest.users_id) {
          const locationRequest = {
            to: user?.users_line_id,
            messages: [
              {
                type: "location",
                title: "ตำแหน่งที่ล้มล่าสุด",
                address: `ตำแหน่งที่ล้มของ ${takecareperson?.takecare_fname} ${takecareperson?.takecare_sname}`,
                latitude: lat,
                longitude: long,
              },
            ],
          };
          try {
            await axios.post(LINE_PUSH_MESSAGING_API, locationRequest, {
              headers: LINE_HEADER,
            });
            console.log("✅ ส่งแผนที่สำเร็จ");
            stop_em = true;
          } catch (err) {
            console.error("❌ ส่งแผนที่ล้มเหลว:", err);
          }
        }

        // 4. ✅ ภารกิจจบแล้ว! รีบแก้ค่ากลับเป็น false ทันที (เดี๋ยวรอบหน้าส่งซ้ำ)
        await prisma.location.updateMany({
          where: { users_id: Number(uId) },
          data: { is_waiting_for_location: false },
        });
      }

      // รอขอดูตำแหน่งปัจจุบัน
      if (
        latest?.is_waiting_for_view_location === true &&
        lat !== 0 &&
        long !== 0
      ) {
        console.log("🚩 พบ User ที่รอดูแผนที่ -> กำลังส่ง LINE...");

        // 3. ส่ง LINE แผนที่ตามไป (ใช้ฟังก์ชัน pushLocationToLine หรือ axios)
        if (latest.users_id) {
          const locationRequest = {
            to: user?.users_line_id,
            messages: [
              {
                type: "location",
                title: "ตำแหน่งปัจจุบัน",
                address: `ตำแหน่งของ ${takecareperson?.takecare_fname} ${takecareperson?.takecare_sname}`,
                latitude: String(lat),
                longitude: String(long),
              },
            ],
          };

          try {
            // await axios.post(LINE_PUSH_MESSAGING_API, locationRequest, {
            //   headers: LINE_HEADER,
            // });
            console.log("User selected 'ดูข้อมูลสุขภาพและตำแหน่งปัจจุบัน'");
            // ดึงข้อมูลผู้ใช้จากระบบ (ใช้ LINE user id)
            const responseUser = await api.getUser(replyToken);
            if (responseUser) {
              const encodedUsersId = encrypt(responseUser.users_id.toString());
              // เรียก API เพื่อดึงข้อมูล takecareperson (endpoint ของเว็บหลัก)
              const respTakecare = await axios.get(
                `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`
              );
              const responseUserTakecareperson = respTakecare.data?.data;

              // ดึง safezone และ location สำหรับ takecareperson นี้
              const responeSafezone = await api.getSafezone(
                responseUserTakecareperson.takecare_id,
                responseUser.users_id
              );
              const responeLocation = await api.getLocation(
                responseUserTakecareperson.takecare_id,
                responseUser.users_id,
                responeSafezone?.safezone_id
              );

              // สร้าง locationData จากพิกัดปัจจุบัน (ใช้ lat/long ที่ได้รับมา)
              const currentLocationData = {
                locat_latitude: String(lat),
                locat_longitude: String(long),
                location_id:
                  responeLocation?.location_id ?? latest?.location_id ?? null,
              };

              // เรียก pushLocation ด้วยอ็อบเจ็กต์ตามที่ฟังก์ชันคาดหวัง โดยใช้พิกัดปัจจุบัน
              await pushLocation({
                replyToken,
                userData: responseUser,
                safezoneData: responeSafezone,
                userTakecarepersonData: responseUserTakecareperson,
                locationData: currentLocationData,
              });
            } else {
              console.log(
                "ไม่พบข้อมูลผู้ใช้จาก API ภายนอกสำหรับ replyLocation"
              );
            }
            console.log("✅ ส่งแผนที่สำเร็จ");
            stop_em = true;
          } catch (err) {
            console.error("❌ ส่งแผนที่ล้มเหลว:", err);
          }
        } else {
          console.log("ไม่พบ latest.users_id สำหรับ replyLocation");
        }

        // 4. ✅ ภารกิจจบแล้ว! รีบแก้ค่ากลับเป็น false ทันที (เดี๋ยวรอบหน้าส่งซ้ำ)
        await prisma.location.updateMany({
          where: { users_id: Number(uId) },
          data: { is_waiting_for_view_location: false },
        });
      } else if (latest?.is_waiting_for_view_location) {
        req_view_location = true;
      }

      // ถ้ามีแถวเดิม -> update ด้วย location_id ที่ถูกต้อง, ถ้าไม่มีก็ create
      let savedLocation;
      if (latest) {
        savedLocation = await prisma.location.update({
          where: { location_id: latest.location_id }, // ✅ แก้ตรงนี้
          data: dataPayload,
        });
      } else {
        savedLocation = await prisma.location.create({ data: dataPayload });
      }

      // ถ้าสถานะเป็น 0 ไม่ต้องแจ้งเตือน
      if (calculatedStatus === 0) {
        if (
          shouldTrack === true &&
          (takecareperson?.safezone_r1_alert_sent ||
            takecareperson?.safezone_r2_alert_sent ||
            takecareperson?.safezone_th_alert_sent)
        ) {
          // รีเซ็ตสถานะการแจ้งเตือนเมื่อกลับเข้ามาในเขตปลอดภัย
          await prisma.takecareperson.updateMany({
            where: {
              users_id: Number(uId),
              takecare_id: Number(takecare_id),
            },
            data: {
              safezone_r1_alert_sent: false,
              safezone_r2_alert_sent: false,
              safezone_th_alert_sent: false,
            },
          });
          const replyToken = user?.users_line_id || "";
          const message = `คุณ ${takecareperson?.takecare_fname} ${takecareperson?.takecare_sname} \nกลับเข้ามาในเขตปลอดภัยแล้ว`;
          if (replyToken) await replyNotification({ replyToken, message, headers: "แจ้งเตือนเขตปลอดภัย" });
        }
        return res.status(200).json({
          message: "success",
          data: savedLocation,
          command_tracking: shouldTrack,
          request_location: req_view_location,
          stop_emergency: stop_em,
        });
      }

      /* 
      =================== Safezone Notification Logic ===================
      ถ้าพบข้อมูลของผู้ใช้(ผู้ดูแล) และ ผู้ที่มีภาวะพึ่งพิง และ อนุญาติการตรวจจับออกนอกเขต
      การแจ้งเตือนจะทำงาน 
      */
      if (user && takecareperson && shouldTrack) {
        const replyToken = user.users_line_id || "";
        // ======== Safezone Threshold Notifications ========
        if (calculatedStatus === 3) {
          if (takecareperson.safezone_r2_alert_sent) {
            // รีเซ็ตสถานะการแจ้งเตือนเมื่อเข้าใกล้เขตปลอดภัย ชั้นที่ 2
            await prisma.takecareperson.updateMany({
              where: {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
              },
              data: {
                safezone_r2_alert_sent: false,
                safezone_th_alert_sent: true,
              },
            });
            const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nกลับเข้าใกล้เขตปลอดภัย ชั้นที่ 2 แล้ว`;
            if (replyToken) await replyNotification({ replyToken, message, headers: "แจ้งเตือนเขตปลอดภัย" });
          } else if (!takecareperson.safezone_th_alert_sent) {
            // ส่งแจ้งเตือนครั้งแรกเมื่อเข้าใกล้เขตปลอดภัย ชั้นที่ 2
            await prisma.takecareperson.updateMany({
              where: {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
              },
              data: {
                safezone_th_alert_sent: true,
              },
            });
            const warningMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nเข้าใกล้เขตปลอดภัย ชั้นที่ 2 แล้ว`;
            if (replyToken)
              await replyNotification({ replyToken, message: warningMessage, headers: "แจ้งเตือนเขตปลอดภัย" });
          }
          // ======== Safezone Level 1 Notifications ========
        } else if (calculatedStatus === 1) {
          if (
            takecareperson.safezone_r2_alert_sent ||
            takecareperson.safezone_th_alert_sent
          ) {
            // รีเซ็ตสถานะการแจ้งเตือนเมื่อกลับเข้ามาในเขตปลอดภัย
            await prisma.takecareperson.updateMany({
              where: {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
              },
              data: {
                safezone_r2_alert_sent: false,
                safezone_th_alert_sent: false,
                safezone_r1_alert_sent: true,
              },
            });
            const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nกลับเข้ามาในเขตปลอดภัย ชั้นที่ 2 แล้ว`;
            if (replyToken) await replyNotification({ replyToken, message, headers: "แจ้งเตือนเขตปลอดภัย" });
          } else if (!takecareperson.safezone_r1_alert_sent) {
            // ส่งแจ้งเตือนครั้งแรกเมื่อออกนอกเขตชั้นที่ 1
            await prisma.takecareperson.updateMany({
              where: {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
              },
              data: {
                safezone_r1_alert_sent: true,
              },
            });
            const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขตปลอดภัย ชั้นที่ 1 แล้ว`;
            if (replyToken) await replyNotification({ replyToken, message, headers: "แจ้งเตือนเขตปลอดภัย" });
          }
          // ======== Safezone Level 2 Notifications ========
        } else if (calculatedStatus === 2) {
          if (!takecareperson.safezone_r2_alert_sent) {
            // ส่งแจ้งเตือนครั้งแรกเมื่อออกนอกเขตชั้นที่ 2
            await prisma.takecareperson.updateMany({
              where: {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
              },
              data: {
                safezone_r2_alert_sent: true,
              },
            });
            const postbackMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขตปลอดภัย ชั้นที่ 2 แล้ว`;
            if (replyToken) {
              await replyNotificationPostback({
                userId: Number(uId),
                takecarepersonId: Number(takecare_id),
                type: "safezone",
                message: postbackMessage,
                replyToken,
              });
            }
          }
        }

        console.log("calculatedStatus:", calculatedStatus);
        return res.status(200).json({
          message: "success",
          data: savedLocation,
          command_tracking: shouldTrack,
          stop_emergency: stop_em,
          request_location: req_view_location,
        });
      } // Safezone Notification Logic Ended
    } catch (error) {
      console.error("Error:", error);
      return res
        .status(500)
        .json({ message: "error", data: "เกิดข้อผิดพลาดในการประมวลผล" });
    }
  } else {
    res.setHeader("Allow", ["PUT", "POST"]);
    return res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
  }
}
