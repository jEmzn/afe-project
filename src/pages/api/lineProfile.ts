import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/prisma";
import {
  replyMessage,
  replyRegistration,
  replyUserData,
  replyNotRegistration,
  replyMenuBorrowequipment,
  replyConnection,
  replyLocation,
  replySetting,
  replyUserInfo,
  replyNotification,
} from "@/utils/apiLineReply";
import { encrypt, parseQueryString } from "@/utils/helpers";
import {
  postbackSafezone,
  postbackAccept,
  postbackClose,
  postbackTemp,
  postbackFall,
  postbackHeartRate,
} from "@/lib/lineFunction";
import * as api from "@/lib/listAPI";

type Data = {
  message: string;
  data?: any;
};
const getUser = async (userId: string) => {
  console.log("Fetching user data for userId:", userId); // เพิ่มการตรวจสอบว่าเราได้ userId ที่ถูกต้อง
  const responseUser = await axios.get(
    `${process.env.WEB_DOMAIN}/api/user/getUser/${userId}`
  );
  if (responseUser.data?.data) {
    console.log("User data retrieved:", responseUser.data.data); // แสดงข้อมูลที่ได้จาก API
    return responseUser.data.data;
  } else {
    console.log("User data not found for userId:", userId); // แสดงกรณีที่ไม่พบข้อมูล
    return null;
  }
};
const getGroupLine = async (groupId: string) => {
  console.log("Fetching group data for groupId:", groupId); // เพิ่มการตรวจสอบการค้นหากลุ่ม
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/master/getGroupLine?group_line_id=${groupId}`
  );
  if (response.data?.data) {
    console.log("Group data retrieved:", response.data.data); // แสดงข้อมูลกลุ่มที่ได้จาก API
    return response.data.data;
  } else {
    console.log("Group data not found for groupId:", groupId); // กรณีที่ไม่พบข้อมูล
    return null;
  }
};
const addGroupLine = async (groupId: string) => {
  console.log("Adding new group data for groupId:", groupId); // เพิ่มการตรวจสอบการเพิ่มกลุ่ม
  const response = await axios.post(
    `${process.env.WEB_DOMAIN}/api/master/getGroupLine`,
    { group_line_id: groupId, group_name: "" }
  );
  if (response.data?.id) {
    console.log("New group added with id:", response.data.id); // แสดง ID ของกลุ่มใหม่ที่เพิ่ม
    return response.data.id;
  } else {
    console.log("Failed to add new group for groupId:", groupId); // กรณีที่ไม่สามารถเพิ่มกลุ่มใหม่ได้
    return null;
  }
};

const getUserTakecareperson = async (userId: string) => {
  console.log("Fetching user takecare person data for userId:", userId); // ตรวจสอบการดึงข้อมูลผู้ดูแล
  const responseUser = await axios.get(
    `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${userId}`
  );
  if (responseUser.data?.data) {
    console.log("User takecare person data retrieved:", responseUser.data.data); // แสดงข้อมูลผู้ดูแลที่ได้จาก API
    return responseUser.data.data;
  } else {
    console.log("User takecare person data not found for userId:", userId); // กรณีที่ไม่พบข้อมูลผู้ดูแล
    return null;
  }
};

const getSafezone = async (takecare_id: number, users_id: number) => {
  console.log(
    `Fetching safezone data for takecare_id: ${takecare_id}, users_id: ${users_id}`
  ); // ตรวจสอบการดึงข้อมูลเขตปลอดภัย
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/setting/getSafezone?takecare_id=${takecare_id}&users_id=${users_id}`
  );
  if (response.data?.data) {
    console.log("Safezone data retrieved:", response.data.data); // แสดงข้อมูลเขตปลอดภัย
    return response.data.data;
  } else {
    console.log(
      "Safezone data not found for takecare_id:",
      takecare_id,
      "users_id:",
      users_id
    ); // กรณีที่ไม่พบข้อมูลเขตปลอดภัย
    return null;
  }
};

const getLocation = async (
  takecare_id: number,
  users_id: number,
  safezone_id: number
) => {
  console.log(
    `Fetching location data for takecare_id: ${takecare_id}, users_id: ${users_id}, safezone_id: ${safezone_id}`
  ); // ตรวจสอบการดึงข้อมูลตำแหน่ง
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/location/getLocation?takecare_id=${takecare_id}&users_id=${users_id}&safezone_id=${safezone_id}`
  );
  if (response.data?.data) {
    console.log("Location data retrieved:", response.data.data); // แสดงข้อมูลตำแหน่ง
    return response.data.data;
  } else {
    console.log(
      "Location data not found for takecare_id:",
      takecare_id,
      "users_id:",
      users_id,
      "safezone_id:",
      safezone_id
    ); // กรณีที่ไม่พบข้อมูลตำแหน่ง
    return null;
  }
};
const getTemperature = async (takecare_id: number, users_id: number) => {
  console.log(
    `Fetching settingTemp data for ${takecare_id}, user_id ${users_id}`
  );
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/setting/getTemperature?takecare_id=${takecare_id}&users_id=${users_id}`
  );
  if (response.data?.data) {
    console.log("settingtemp data retrieved ", response.data.data);
    return response.data.data;
  } else {
    console.log(
      "settingtemp data not found for takecare_id:",
      takecare_id,
      "users_id:",
      users_id
    );
    return null;
  }
};
const getHeartRate = async (takecare_id: number, users_id: number) => {
  console.log(
    `Fetching heart rate setting data for takecare_id: ${takecare_id}, users_id: ${users_id}`
  );
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/setting/getHeartRate?takecare_id=${takecare_id}&users_id=${users_id}`
  );
  if (response.data?.data) {
    console.log("Heart rate setting data retrieved", response.data.data);
    return response.data.data;
  } else {
    console.log(
      "Heart rate setting data not found for takecare_id:",
      takecare_id,
      "users_id:",
      users_id
    );
    return null;
  }
};

// ...existing code...
export async function handleViewLocation(replyToken: string, userId: string) {
  // ดึงข้อมูลผู้ใช้จากเว็บหลัก
  const responseUser = await api.getUser(userId);
  if (!responseUser) return { ok: false, reason: "user_not_registered" };

  const encodedUsersId = encrypt(responseUser.users_id.toString());
  const responseUserTakecareperson = await getUserTakecareperson(encodedUsersId);
  if (!responseUserTakecareperson) return { ok: false, reason: "no_takecare" };

  const responeSafezone = await getSafezone(
    responseUserTakecareperson.takecare_id,
    responseUser.users_id
  );
  if (!responeSafezone) return { ok: false, reason: "no_safezone" };

  const responeLocation = await getLocation(
    responseUserTakecareperson.takecare_id,
    responseUser.users_id,
    responeSafezone.safezone_id
  );

	await replyLocation({
		replyToken,
		userData: responseUser,
		userTakecarepersonData: responseUserTakecareperson,
		safezoneData: responeSafezone,
		locationData: responeLocation,
	});
	return { ok: true, waiting: false };
}
// ...existing code...

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      console.log("Received request body:", req.body); // แสดงข้อมูลที่ได้รับจากคำขอ

      if (req.body.events[0]) {
        const events = req.body.events[0];

        const replyToken = events.replyToken;
        const userId = events.source.userId;

        console.log("Processing event for userId:", userId); // แสดงว่าเริ่มการประมวลผลสำหรับผู้ใช้

        if (events.type === "message" && events.source.type === "user") {
          if (events.message.type === "text") {
            console.log("Received text message:", events.message.text); // แสดงข้อความที่ได้รับจากผู้ใช้

            if (events.message.text === "ลงทะเบียน") {
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                console.log(
                  "User is already registered, replying with user data."
                );
                await replyUserData({ replyToken, userData: responseUser });
              } else {
                console.log("User not registered, sending registration reply.");
                await replyRegistration({ replyToken, userId });
              }
            } else if (events.message.text === "การยืม-คืนครุภัณฑ์") {
              console.log("User selected 'การยืม-คืนครุภัณฑ์'");
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                console.log(
                  "User is registered, replying with menu borrow equipment."
                );
                await replyMenuBorrowequipment({
                  replyToken,
                  userData: responseUser,
                });
              } else {
                console.log(
                  "User not registered, sending not registration reply."
                );
                await replyNotRegistration({ replyToken, userId });
              }
            } else if (events.message.text === "การเชื่อมต่อนาฬิกา") {
              console.log("User selected 'การเชื่อมต่อนาฬิกา'");
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                const encodedUsersId = encrypt(
                  responseUser.users_id.toString()
                );
                const responseUserTakecareperson = await getUserTakecareperson(
                  encodedUsersId
                );
                if (responseUserTakecareperson) {
                  console.log("Replying with connection information.");
                  await replyConnection({
                    replyToken,
                    userData: responseUser,
                    userTakecarepersonData: responseUserTakecareperson,
                  });
                } else {
                  console.log(
                    "No takecare person added, replying with error message."
                  );
                  await replyMessage({
                    replyToken: req.body.events[0].replyToken,
                    message:
                      "ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถเชื่อมต่อนาฬิกาได้",
                  });
                }
              } else {
                console.log(
                  "User not registered, sending not registration reply."
                );
                await replyNotRegistration({ replyToken, userId });
              }
            } else if (
              events.message.text === "ดูข้อมูลสุขภาพและตำแหน่งปัจจุบัน"
            ) {
              console.log("User selected 'ดูข้อมูลสุขภาพและตำแหน่งปัจจุบัน'");
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                const encodedUsersId = encrypt(
                  responseUser.users_id.toString()
                );
                const responseUserTakecareperson = await getUserTakecareperson(
                  encodedUsersId
                );
                if (responseUserTakecareperson) {
                  const responeSafezone = await getSafezone(
                    responseUserTakecareperson.takecare_id,
                    responseUser.users_id
                  );
                  if (responeSafezone) {
                    const responeLocation = await getLocation(
                      responseUserTakecareperson.takecare_id,
                      responseUser.users_id,
                      responeSafezone.safezone_id
                    );
                    const lat = Number(responeLocation?.locat_latitude || 0);
                    const long = Number(responeLocation?.locat_longitude || 0);
                    // 2. เช็คแค่เงื่อนไขเดียว: "เป็น 0.0 หรือไม่?"
                    if (lat === 0 || long === 0) {
                      // ❌ กรณี 0.0: ยังไม่มีพิกัด -> เข้าสู่โหมด "รอ"
                      console.log("พิกัดเป็น 0.0 -> ปักธงรอ + สั่งนาฬิกา");

                      // ปักธงรอ (View) + สั่งนาฬิกา (Request)
                      await prisma.location.updateMany({
                        where: { users_id: Number(responseUser.users_id) },
                        data: {
                          is_waiting_for_view_location: true, // 🚩 ปักธงว่าคนนี้รออยู่นะ
                        },
                      });
                    } else {
                      console.log("Replying with location information.");
                      await replyLocation({
                        replyToken,
                        userData: responseUser,
                        userTakecarepersonData: responseUserTakecareperson,
                        safezoneData: responeSafezone,
                        locationData: responeLocation,
                      });
                    }
                  } else {
                    console.log(
                      "Safezone not set, replying with error message."
                    );
                    await replyMessage({
                      replyToken: req.body.events[0].replyToken,
                      message:
                        "ยังไม่ได้ตั้งค่าเขตปลอดภัยไม่สามารถดูตำแหน่งปัจจุบันได้",
                    });
                  }
                } else {
                  console.log(
                    "No takecare person added, replying with error message."
                  );
                  await replyMessage({
                    replyToken: req.body.events[0].replyToken,
                    message:
                      "ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถดูตำแหน่งปัจจุบันได้",
                  });
                }
              } else {
                console.log(
                  "User not registered, sending not registration reply."
                );
                await replyNotRegistration({ replyToken, userId });
              }
            } else if (events.message.text === "ตั้งค่าความปลอดภัย") {
              console.log("User selected 'ตั้งค่าความปลอดภัย'");
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                const encodedUsersId = encrypt(
                  responseUser.users_id.toString()
                );
                const responseUserTakecareperson = await getUserTakecareperson(
                  encodedUsersId
                );
                if (responseUserTakecareperson) {
                  const responeSafezone = await getSafezone(
                    responseUserTakecareperson.takecare_id,
                    responseUser.users_id
                  );
                  const responseTemp = await getTemperature(
                    responseUserTakecareperson.takecare_id,
                    responseUser.users_id
                  );
                  const responseHeartRate = await getHeartRate(
                    responseUserTakecareperson.takecare_id,
                    responseUser.users_id
                  );
                  console.log("Replying with safezone setting information.");
                  await replySetting({
                    replyToken,
                    userData: responseUser,
                    userTakecarepersonData: responseUserTakecareperson,
                    safezoneData: responeSafezone,
                    temperatureSettingData: responseTemp,
                    heartrateSettingData: responseHeartRate,
                  });
                } else {
                  console.log(
                    "No takecare person added, replying with error message."
                  );
                  await replyMessage({
                    replyToken: req.body.events[0].replyToken,
                    message:
                      "ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถตั้งค่าเขตปลอดภัยได้",
                  });
                }
              } else {
                console.log(
                  "User not registered, sending not registration reply."
                );
                await replyNotRegistration({ replyToken, userId });
              }
            } else if (events.message.text === "ดูข้อมูลผู้ใช้งาน") {
              console.log("User selected 'ดูข้อมูลผู้ใช้งาน'");
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                const encodedUsersId = encrypt(
                  responseUser.users_id.toString()
                );
                const responseUserTakecareperson = await getUserTakecareperson(
                  encodedUsersId
                );
                console.log("Replying with user information.");
                await replyUserInfo({
                  replyToken,
                  userData: responseUser,
                  userTakecarepersonData: responseUserTakecareperson,
                });
              } else {
                console.log(
                  "User not registered, sending not registration reply."
                );
                await replyNotRegistration({ replyToken, userId });
              }
            }
          }
        }

        // เพิ่มการตรวจสอบกรณีที่เป็นการเข้าร่วมกลุ่ม
        if (events.source.type === "group" && events.type === "join") {
          console.log("Joined a new group, groupId:", events.source.groupId);

          const groupLine = await getGroupLine(events.source.groupId);
          if (!groupLine) {
            console.log(
              "Group not found, adding new group:",
              events.source.groupId
            );
            await addGroupLine(events.source.groupId);
          }
        }

        // เพิ่มการตรวจสอบในกรณีที่เป็นการโพสต์
        if (events.type === "postback" && events.postback?.data) {
          const postback = parseQueryString(events.postback.data);
          console.log("Received postback data:", postback);

          if (postback.type === "safezone") {
            console.log("Handling safezone postback data.");
            const replyToken = await postbackSafezone({
              userLineId: postback.userLineId,
              takecarepersonId: Number(postback.takecarepersonId),
            });
            if (replyToken) {
              console.log("Safezone request sent, replying with notification.");
              await replyNotification({
                replyToken,
                message: "ส่งคำขอความช่วยเหลือแล้ว",
              });
            }
          } else if (postback.type === "temperature") {
            console.log("Handling temperature postback data.");
            const replyToken = await postbackTemp({
              userLineId: postback.userLineId,
              takecarepersonId: Number(postback.takecarepersonId),
            });

            if (replyToken) {
              console.log(
                "Temperature request sent, replying with notification."
              );
              await replyNotification({
                replyToken,
                message: "ส่งคำขอความช่วยเหลือแล้ว",
              });
            }
          }
          // ---- เพิ่มส่วนนี้เข้าไป ----
          else if (postback.type === "fall") {
            console.log("Handling fall postback data.");
            const replyToken = await postbackFall({
              userLineId: postback.userLineId,
              takecarepersonId: Number(postback.takecarepersonId),
            });
            if (replyToken) {
              console.log("Fall request sent, replying with notification.");
              await replyNotification({
                replyToken,
                message: "ส่งคำขอความช่วยเหลือแล้ว",
              });
            }
          } else if (postback.type === "heartrate") {
            console.log("Handling heart rate postback data.");
            const replyToken = await postbackHeartRate({
              userLineId: postback.userLineId,
              takecarepersonId: Number(postback.takecarepersonId),
            });

            if (replyToken) {
              console.log(
                "Heart Rate request sent, replying with notification."
              );
              await replyNotification({
                replyToken,
                message: "ส่งคำขอความช่วยเหลือแล้ว",
              });
            }
          } else if (postback.type === "accept") {
            console.log("Handling accept postback data.");
            let data = postback;
            data.groupId = events.source.groupId;
            data.userIdAccept = events.source.userId;
            const replyToken = await postbackAccept(data);
            if (replyToken) {
              console.log(
                "Accept request handled, replying with notification."
              );
              await replyNotification({
                replyToken,
                message: "ตอบรับเคสขอความช่วยเหลือแล้ว",
              });
            }
          } else if (postback.type === "close") {
            console.log("Handling close postback data.");
            let data = postback;
            data.groupId = events.source.groupId;
            data.userIdAccept = events.source.userId;
            const replyToken = await postbackClose(data);
            if (replyToken) {
              console.log("Close request handled, replying with notification.");
              await replyNotification({
                replyToken,
                message: "ปิดเคสขอความช่วยเหลือแล้ว",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error occurred:", error); // แสดงข้อผิดพลาด
      return await replyMessage({
        replyToken: req.body.events[0].replyToken,
        message: "ระบบขัดข้องกรุณาลองใหม่อีกครั้ง",
      });
    }
    return res.status(200).json({ message: "success" });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
  }
}
