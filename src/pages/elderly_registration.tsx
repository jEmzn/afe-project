import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Container from 'react-bootstrap/Container';
import CryptoJS from 'crypto-js';

import withCommonData from '@/lib/withCommonData';

import styles from '@/styles/page.module.css'

import Form from 'react-bootstrap/Form';

import InputLabel from '@/components/Form/InputLabel'
import ModalAlert from '@/components/Modals/ModalAlert'
import ButtonState from '@/components/Button/ButtonState';
import DatePickerX from '@/components/DatePicker/DatePickerX';
import { encrypt } from '@/utils/helpers'

import axios from 'axios';


interface UserTakecareData {
    isLogin: boolean;
    data:{
        users_id         ?: number;
        takecare_fname   ?: string;
        takecare_sname   ?: string;
        takecare_birthday?: string;
        gender_id        ?: number;
        marry_id         ?: number;
        takecare_number  ?: string;
        takecare_moo     ?: string;
        takecare_road    ?: string;
        takecare_tubon   ?: string;
        takecare_amphur  ?: string;
        takecare_province?: string;
        takecare_postcode?: string;
        takecare_tel1    ?: string;
        takecare_disease ?: string;
        takecare_drug    ?: string;
        takecare_status  ?: number;
    } | null;
    users_id: number | null;
  }

const ElderlyRegistration = () => {
    const router = useRouter();

    const [validated, setValidated] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState<string>("");
    const [dataUser, setDataUser] = useState<UserTakecareData>({ isLogin: true, data: null, users_id: null });
    const [takecareBirthday, setTakecareBirthday] = useState<Date | null>(new Date());
    const [masterGender, setMasterGender] = useState<[]>([]);
    const [masterMarry, setMasterMarry] = useState<[]>([]);

    useEffect(() => {
        const auToken = router.query.auToken
        getMasterData()

        if (auToken) {
            onGetUserProfile(auToken as string)
            onGetUserData(auToken as string)
        }
      
    }, [router.query.auToken])

    const getMasterData = async () => {
        try {
            const response1 = await axios.get(`${process.env.WEB_DOMAIN}/api/master/getGender`);
            const response2 = await axios.get(`${process.env.WEB_DOMAIN}/api/master/getMarry`);
            if (response1.data) {
                setMasterGender(response1.data.data)
            }
            if (response2.data) {
                setMasterMarry(response2.data.data)
            }
        } catch (error) {
            setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูล Master ได้' })
        }
    }

    const onGetUserProfile = async (auToken: string) => {
        try {
          
            const response = await axios.get(`${process.env.WEB_DOMAIN}/api/getProfile?id=${auToken}`);
           
            if (response.data) {
                setDisplayName(response.data.data?.displayName)
            }
        } catch (error) {
            setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูล LINE ของท่านได้ กรุณาลองใหม่อีกครั้ง' })
        }
    }
    const onGetUserData = async (auToken: string) => {
        try {
            const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
            if(responseUser.data?.data){
                const encodedUsersId = encrypt(responseUser.data?.data.users_id.toString());
                
                const responseTakecareperson = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`);
                const data = responseTakecareperson.data?.data
                if(data){
                    setTakecareBirthday(new Date(data.takecare_birthday))
                }
                setDataUser({ isLogin: false, data, users_id: responseUser.data?.data.users_id })
            }else{
                setDataUser({ isLogin: false, data: null, users_id: responseUser.data?.data.users_id })
            }
        } catch (error) {
            console.log("🚀 ~ file: registration.tsx:66 ~ onGetUserData ~ error:", error)
            setDataUser({ isLogin: false, data: null, users_id: null })
            setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง' })
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const form = event.currentTarget;
           
            if (form.checkValidity() === false) {
                setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
            } else {
                   if(dataUser.users_id){
                       const data = {
                           users_id         : dataUser.users_id,
                           takecare_fname   : form['takecare_fname'].value,
                           takecare_sname   : form['takecare_sname'].value,
                           takecare_birthday: takecareBirthday,
                           gender_id        : Number(form['gender'].value),
                           marry_id         : Number(form['marry'].value),
                           takecare_number  : form['takecare_number'].value,
                           takecare_moo     : form['takecare_moo'].value,
                           takecare_road    : form['takecare_road'].value,
                           takecare_tubon   : form['takecare_tubon'].value,
                           takecare_amphur  : form['takecare_amphur'].value,
                           takecare_province: form['takecare_province'].value,
                           takecare_postcode: form['takecare_postcode'].value,
                           takecare_tel1    : form['takecare_tel1'].value,
                           takecare_disease : form['takecare_disease'].value,
                           takecare_drug    : form['takecare_drug'].value,
   
                       }
                       event.stopPropagation();
                       setLoading(true)
                       await axios.post(`${process.env.WEB_DOMAIN}/api/registration/takecareperson`, data)
                       onGetUserData(router.query.auToken as string)
                       setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })
                       setLoading(false)
                   } 
                
               
            }
        } catch (error) {
            setLoading(false)
            setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้' })
        } finally {
            setLoading(false)
            setValidated(true);
            event.stopPropagation();
        }

    };
    if (dataUser.isLogin) return null;

    return (
        <Container>
            <div className={styles.main}>
                <Image src={'/images/Logo.png'} width={100} height={100} alt="Logo" priority />
                <h1 className="py-2">ลงทะเบียนผู้สูงอายุ</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
                    <Form.Group>
                        <InputLabel label="LINE-USER" id="lineUser" defaultValue={displayName} disabled required />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ชื่อ" id="takecare_fname" placeholder="กรอกชื่อ" required defaultValue={dataUser.data?.takecare_fname || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="นามสกุล" id="takecare_sname" placeholder="กรอกนามสกุล" required defaultValue={dataUser.data?.takecare_sname || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <p className="m-0">วันเดือนปีเกิด</p>
                        <div className="py-2">
                            <DatePickerX selected={takecareBirthday} onChange={(date) => setTakecareBirthday(date)} disabled={dataUser.data ? false : false} />
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <p className="m-0">เพศ</p>
                        <div className="d-flex justify-content-around">
                            {
                                masterGender.length > 0 && masterGender.map((item: any, index: number) => {
                                    return (
                                        <Form.Check
                                            key={`${index}-gender`}
                                            label={item.gender_describe}
                                            name="gender"
                                            type={'radio'}
                                            value={item.gender_id}
                                            defaultChecked={dataUser.data?.gender_id ? (dataUser.data?.gender_id === item.gender_id ? true : false) : (index === 0 ? true : false) }
                                            disabled={dataUser.data ? true : false}
                                        />
                                    )
                                })
                            }
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <p className="m-0">สถานะการสมรส</p>
                        <div className="px-4">
                            {
                                masterMarry.length > 0 && masterMarry.map((item: any, index: number) => {
                                    return (
                                        <Form.Check
                                            key={`${index}-marry`}
                                            className="py-1"
                                            label={item.marry_describe}
                                            name="marry"
                                            type={'radio'}
                                            value={item.marry_id}
                                            defaultChecked={dataUser.data?.marry_id ? (dataUser.data?.marry_id === item.marry_id ? true : false) : (index === 0 ? true : false)}
                                            disabled={dataUser.data ? true : false}
                                        />
                                    )
                                })
                            }
                        </div>
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เลขที่บ้าน" id="takecare_number" placeholder="123/12" max={10} defaultValue={dataUser.data?.takecare_number || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="หมู่" id="takecare_moo" placeholder="1" max={5} defaultValue={dataUser.data?.takecare_moo || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ถนน" id="takecare_road" placeholder="-" defaultValue={dataUser.data?.takecare_road || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ตำบล" id="takecare_tubon" placeholder="กรอกตำบล" defaultValue={dataUser.data?.takecare_tubon || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="อำเภอ" id="takecare_amphur" placeholder="กรอกอำเภอ" defaultValue={dataUser.data?.takecare_amphur || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="จังหวัด" id="takecare_province" placeholder="กรอกจังหวัด" defaultValue={dataUser.data?.takecare_province || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="รหัสไปรษณีย์" id="takecare_postcode" placeholder="กรอกรหัสไปรษณีย์" max={5} type="number" defaultValue={dataUser.data?.takecare_postcode || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เบอร์โทรศัพท์" id="takecare_tel1" placeholder="กรอกเบอร์โทรศัพท์" max={12} defaultValue={dataUser.data?.takecare_tel1 || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="โรคประจำตัว" id="takecare_disease" placeholder="กรอกโรคประจำตัว" defaultValue={dataUser.data?.takecare_disease || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ยาที่ใช้ประจำ" id="takecare_drug" placeholder="กรอกยาที่ใช้ประจำ" defaultValue={dataUser.data?.takecare_drug || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    {
                        !dataUser.data && (
                            <Form.Group className="d-flex justify-content-center py-3">
                                <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
                            </Form.Group>
                        )
                    }
                    
                </Form>
            </div>
            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
        </Container>
    )
}
export const getServerSideProps: GetServerSideProps = withCommonData({
    title: 'ลงทะเบียนผู้สูงอายุ',
    description: 'ลงทะเบียนผู้สูงอายุ',
    slug: '',
    titleBar: 'ลงทะเบียนผู้สูงอายุ'
});
export default ElderlyRegistration