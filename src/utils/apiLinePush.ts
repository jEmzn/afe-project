import axios from "axios";
import moment from "moment";
import prisma from "@/lib/prisma";
const WEB_API = process.env.WEB_API_URL;
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_MESSAGING_API =
  process.env.DRY_RUN === "true"
    ? "https://api.line.me/v2/bot/message/validate/push"
    : "https://api.line.me/v2/bot/message/push";
// const LINE_PUSH_MESSAGING_API ="https://api.line.me/v2/bot/message/validate/push";
const LINE_PROFILE_API = "https://api.line.me/v2/bot/profile";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN_LINE}`, // Replace with your LINE Channel Access Token
};

interface ReplyMessage {
  replyToken: string;
  message: string;
}
interface ReplyRegistration {
  replyToken: string;
  userId: string;
}
interface ReplyNotification {
  replyToken: string;
  message: string;
  groupLineId?: string | null;
}
interface ReplyNotificationPostback {
  userId: number;
  takecarepersonId: number;
  type: string;
  message: string;
  replyToken: string;
}
interface ReplyNotificationPostbackTemp {
  userId: number;
  takecarepersonId: number;
  type: string;
  message: string;
  replyToken: string;
}
interface ReplyNotificationPostbackfall {
  userId: number;
  takecarepersonId: number;
  type: string;
  message: string;
  replyToken: string;
}
interface ReplyNotificationPostbackHeart {
  userId: number;
  takecarepersonId: number;
  type: string;
  message: string;
  replyToken: string;
}
interface ReplyUserData {
  replyToken: string;
  userData: {
    users_id: string;
    users_line_id: string;
    users_fname: string;
    users_sname: string;
    users_pin: string;
    users_number: string;
    users_moo: string;
    users_road: string;
    users_tubon: string;
    users_amphur: string;
    users_province: string;
    users_postcode: string;
    users_tel1: string;
    users_status_id: {
      status_name: string;
    };
  };
  userTakecarepersonData?: any;
}
interface ReplySettingData {
  replyToken: string;
  userData: {
    users_id: string;
    users_line_id: string;
    users_fname: string;
    users_sname: string;
    users_pin: string;
    users_number: string;
    users_moo: string;
    users_road: string;
    users_tubon: string;
    users_amphur: string;
    users_province: string;
    users_postcode: string;
    users_tel1: string;
    users_status_id: {
      status_name: string;
    };
  };
  userTakecarepersonData?: any;
  safezoneData?: any;
  temperatureSettingData?: any;
  heartrateSettingData?: any;
}
interface PushLocationData {
  replyToken: string;
  userData: {
    users_id: string;
    users_line_id: string;
    users_fname: string;
    users_sname: string;
    users_pin: string;
    users_number: string;
    users_moo: string;
    users_road: string;
    users_tubon: string;
    users_amphur: string;
    users_province: string;
    users_postcode: string;
    users_tel1: string;
    users_status_id: {
      status_name: string;
    };
  };
  userTakecarepersonData?: any;
  safezoneData?: any;
  locationData?: any;
}

const baseline = (label: string, value: string, valueColor?: string) => ({
  type: "box",
  layout: "baseline",
  contents: [
    {
      type: "text",
      text: label,
      size: "sm",
      color: "#555555",
      flex: 3,
      wrap: true,
    },
    {
      type: "text",
      text: value,
      size: "sm",
      color: valueColor || "#111111",
      flex: 5,
      wrap: true,
    },
  ],
});
const layoutBoxBaseline = (
  label: string,
  text: string,
  flex1 = 2,
  flex2 = 5
) => {
  return {
    type: "box",
    layout: "baseline",
    contents: [
      {
        type: "text",
        text: label,
        flex: flex1,
        size: "sm",
        color: "#AAAAAA",
      },
      {
        type: "text",
        text: text,
        flex: flex2,
        size: "sm",
        color: "#666666",
        wrap: true,
      },
    ],
  };
};

// การ์ด KPI สำหรับค่า Vital (ตัวเลขใหญ่ + หน่วย)
const kpiBox = (label: string, value: string, unit: string, color: string) => ({
  type: "box",
  layout: "vertical",
  flex: 1,
  backgroundColor: "#F7F9FC",
  paddingAll: "12px",
  spacing: "6px",
  alignItems: "center",
  contents: [
    { type: "text", text: label, size: "xs", color: "#6B7280" },
    { type: "text", text: value, size: "3xl", weight: "bold", color },
    { type: "text", text: unit, size: "xs", color: "#6B7280" },
  ],
});

export const getUserProfile = async (userId: string) => {
  try {
    const response = await axios.get(`${LINE_PROFILE_API}/${userId}`, {
      headers: LINE_HEADER,
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
};

export const replyMessage = async ({ replyToken, message }: ReplyMessage) => {
  try {
    const requestData = {
      replyToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    const response = await axios.post(LINE_MESSAGING_API, requestData, {
      headers: LINE_HEADER,
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
};

export const pushMessage = async ({ replyToken, message }: ReplyMessage) => {
  try {
    const requestData = {
      to: replyToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    const response = await axios.post(LINE_PUSH_MESSAGING_API, requestData, {
      headers: LINE_HEADER,
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
};

export const pushLocation = async ({
  replyToken,
  userData,
  safezoneData,
  userTakecarepersonData,
  locationData,
}: PushLocationData) => {
  try {
    // 1) พิกัด
    let latitude = Number(safezoneData.safez_latitude);
    let longitude = Number(safezoneData.safez_longitude);
    if (locationData) {
      latitude = Number(locationData.locat_latitude);
      longitude = Number(locationData.locat_longitude);
    }

    // 2) ดึงค่า Temp/HR "ล่าสุด" (ไม่แสดงเวลา/คำว่าล่าสุด)
    const userIdNum = Number(userData.users_id);
    const takecareIdNum = Number(userTakecarepersonData.takecare_id);

    const [lastTemp, lastHR] = await Promise.all([
      prisma.temperature_records.findFirst({
        where: { users_id: userIdNum, takecare_id: takecareIdNum },
        orderBy: { record_date: "desc" },
        select: { temperature_value: true, status: true },
      }),
      prisma.heartrate_records.findFirst({
        where: { users_id: userIdNum, takecare_id: takecareIdNum },
        orderBy: { record_date: "desc" },
        select: { bpm: true, status: true },
      }),
    ]);

    const tempVal = lastTemp
      ? Number(lastTemp.temperature_value).toFixed(1)
      : "—";
    const hrVal = lastHR ? String(Number(lastHR.bpm)) : "—";

    const tempColor = lastTemp?.status === 1 ? "#E11D48" : "#0EA5E9"; // แดงถ้าผิดปกติ, ฟ้าเมื่อปกติ
    const hrColor = lastHR?.status === 1 ? "#E11D48" : "#10B981"; // แดงถ้าผิดปกติ, เขียวเมื่อปกติ

    const messages = [
      // แผนที่ตำแหน่ง (ข้อความประเภท location เพิ่มอะไรไม่ได้)
      {
        type: "location",
        title: `ตำแหน่งปัจจุบันของผู้ที่มีภาวะพึ่งพิง ${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`,
        address: "สถานที่ตั้งปัจจุบันของผู้ที่มีภาวะพึ่งพิง",
        latitude,
        longitude,
      },
      // Flex การ์ดรายละเอียด + Vitals ดีไซน์ใหม่
      {
        type: "flex",
        altText: "ข้อมูลตำแหน่งและสุขภาพ",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            paddingAll: "16px",
            spacing: "12px",
            contents: [
              {
                type: "text",
                text: "ตำแหน่งปัจจุบัน",
                color: "#111111",
                size: "xl",
                weight: "bold",
              },
              {
                type: "box",
                layout: "vertical",
                spacing: "6px",
                contents: [
                  baseline(
                    "ชื่อ-สกุล",
                    `${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`
                  ),
                  baseline("Latitude", String(latitude)),
                  baseline("Longitude", String(longitude)),
                ],
              },
              { type: "separator", margin: "md" },

              // แถว KPI vitals (สวยและอ่านง่าย)
              {
                type: "box",
                layout: "horizontal",
                spacing: "12px",
                contents: [
                  kpiBox("อุณหภูมิ", tempVal, "°C", tempColor),
                  kpiBox("ชีพจร", hrVal, "bpm", hrColor),
                ],
              },

              // ปุ่มต่าง ๆ
              {
                type: "box",
                layout: "vertical",
                spacing: "10px",
                margin: "lg",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#4477CE",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: `โทร ${
                        userTakecarepersonData.takecare_tel1 || "-"
                      }`,
                      uri: `tel:${userTakecarepersonData.takecare_tel1 || "-"}`,
                    },
                  },
                  {
                    type: "button",
                    style: "primary",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: "ดูแผนที่จากระบบ",
                      uri: `${WEB_API}/location?auToken=${
                        userData.users_line_id
                      }&idsafezone=${safezoneData.safezone_id}&idlocation=${
                        locationData ? locationData.location_id : ""
                      }`,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    const to = userData?.users_line_id || replyToken;
    if (!to) {
      console.warn(
        "pushLocation: ไม่มี target userId (users_line_id) — ยกเลิกการส่ง"
      );
      return;
    }

    const requestData = {
      to,
      messages,
    };

    await axios.post(LINE_PUSH_MESSAGING_API, requestData, {
      headers: LINE_HEADER,
    });
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
  }
};
