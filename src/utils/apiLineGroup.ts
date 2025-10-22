import axios from 'axios';
import moment from 'moment';
import prisma from '@/lib/prisma'
const WEB_API = process.env.WEB_API_URL;
const LINE_INFO_API = 'https://api.line.me/v2/bot/info';
const LINE_GROUP_API = 'https://api.line.me/v2/bot/group/'
const LINE_PUSH_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';
const LINE_PROFILE_API = 'https://api.line.me/v2/bot/profile';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN_LINE}`, // Replace with your LINE Channel Access Token
};

interface ReplyNotification {
    resUser          : {
        users_related_borrow: string;
        users_fname         : string;
        users_sname         : string;
        users_tel1          : string;
        users_line_id       : string;
    };
    resTakecareperson: {
        takecare_fname: string;
        takecare_sname: string;
        takecare_tel1 : string;
        takecare_id   : number;
    };
    resSafezone      : {};
    extendedHelpId   : number;
    locationData : {
        locat_latitude : number;
        locat_longitude: number;
    };
}
interface ReplyNoti {
    replyToken : string;
    message    : string;
    userIdAccept: string;
}
export const getUserProfile = async (userId: string) => {
    try {
        const response = await axios.get(`${LINE_PROFILE_API}/${userId}`, { headers: LINE_HEADER });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

const layoutBoxBaseline = (label: string, text: string, flex1 = 2, flex2 = 5) => {
    return {
        type: "box",
        layout: "baseline",
        contents: [
            {
                type: "text",
                text: label,
                flex: flex1,
                size: "sm",
                color: "#AAAAAA"
            },
            {
                type: "text",
                text: text,
                flex: flex2,
                size: "sm",
                color: "#666666",
                wrap: true
            }
        ]
    }
}

const header1 = () =>{
    const h1 = {
        type    : "text",
        text    : " ",
        contents: [
            {
                type      : "span",
                text      : "แจ้งเตือนช่วยเหลือเพิ่มเติม",
                color     : "#FC0303",
                size      : "xl",
                weight    : "bold",
                decoration: "none"
            },
            {
                type      : "span",
                text      : " ",
                size      : "xxl",
                decoration: "none"
            }
        ]
    }
    const h2 = {
        type  : "separator",
        margin: "md"
    }
    return [h1, h2]
}

export const replyNotification = async ({
    resUser,
    resTakecareperson,
    resSafezone,
    extendedHelpId,
    locationData,
}: ReplyNotification) => {
    try {
        const latitude = Number(locationData.locat_latitude);
        const longitude = Number(locationData.locat_longitude);

        // ค้นหากลุ่มที่เปิดใช้งานจากฐานข้อมูล
        const groupLine = await prisma.groupLine.findFirst({
            where: {
                group_status: 1,  // ค้นหากลุ่มที่เปิดใช้งาน
            },
        });

        if (groupLine) {
            const groupLineId = groupLine.group_line_id;  // ดึง group_line_id ที่ต้องการ

            const requestData = {
                to: groupLineId,  // ใช้ groupLineId ในการส่งข้อความไปยังไลน์กลุ่ม
                messages: [
                    {
                        type: 'location',
                        title: `ตำแหน่งปัจจุบันของผู้สูงอายุ ${resTakecareperson.takecare_fname} ${resTakecareperson.takecare_sname}`,
                        address: 'สถานที่ตั้งปัจจุบันของผู้สูงอายุ',
                        latitude: latitude,
                        longitude: longitude,
                    },
                    {
                        type: 'flex',
                        altText: 'แจ้งเตือน',
                        contents: {
                            type: 'bubble',
                            body: {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    header1()[0],
                                    header1()[1],
                                    {
                                        type: 'text',
                                        text: 'ข้อมูลผู้ดูแล',
                                        size: 'md',
                                        color: '#555555',
                                        wrap: true,
                                        margin: 'sm',
                                    },
                                    {
                                        type: 'box',
                                        layout: 'vertical',
                                        margin: 'xxl',
                                        spacing: 'sm',
                                        contents: [
                                            layoutBoxBaseline('ชื่อ-สกุล', `${resUser.users_fname} ${resUser.users_sname}`, 4, 5),
                                            layoutBoxBaseline('เบอร์โทร', `${resUser.users_tel1} `, 4, 5),
                                        ],
                                    },
                                    {
                                        type: 'separator',
                                        margin: 'xxl',
                                    },
                                    {
                                        type: 'text',
                                        text: 'ข้อมูลผู้สูงอายุ',
                                        size: 'md',
                                        color: '#555555',
                                        wrap: true,
                                        margin: 'sm',
                                    },
                                    {
                                        type: 'box',
                                        layout: 'vertical',
                                        margin: 'xxl',
                                        spacing: 'sm',
                                        contents: [
                                            layoutBoxBaseline('ชื่อ-สกุล', `${resTakecareperson.takecare_fname} ${resTakecareperson.takecare_sname}`, 4, 5),
                                            layoutBoxBaseline('เบอร์โทร', `${resTakecareperson.takecare_tel1} `, 4, 5),
                                        ],
                                    },
                                    {
                                        type: 'button',
                                        style: 'primary',
                                        height: 'sm',
                                        margin: 'xxl',
                                        action: {
                                            type: 'postback',
                                            label: 'ตอบรับเคสช่วยเหลือ',
                                            data: `type=accept&takecareId=${resTakecareperson.takecare_id}&extenId=${extendedHelpId}&userLineId=${resUser.users_line_id}`,
                                        },
                                    },
                                    {
                                        type: 'button',
                                        style: 'primary',
                                        height: 'sm',
                                        margin: 'xxl',
                                        color: '#4477CE',
                                        action: {
                                            type: 'postback',
                                            label: 'ปิดเคสช่วยเหลือ',
                                            data: `type=close&takecareId=${resTakecareperson.takecare_id}&extenId=${extendedHelpId}&userLineId=${resUser.users_line_id}`,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            };

            // ส่งข้อความไปยังกลุ่ม
            await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers: LINE_HEADER });
        } else {
            console.log('ไม่พบกลุ่มไลน์ที่ต้องการส่งข้อความไป');
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
};


export const replyNoti = async ({
    replyToken,
    userIdAccept,
    message
}: ReplyNoti) => {
    try {
        const profile = await getUserProfile(userIdAccept);
        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                header1()[0],
                                header1()[1],
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : `คุณ ${profile.displayName}`,
                                            color     : "#555555",
                                            size      : "md",
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : message,
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}