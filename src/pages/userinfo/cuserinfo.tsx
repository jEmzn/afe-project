'use client'
import React, { useEffect, useState } from 'react'
import Container from 'react-bootstrap/Container';
import axios from 'axios';
import { useRouter } from 'next/router'

import styles from '@/styles/page.module.css'

import Form from 'react-bootstrap/Form';

import InputLabel from '@/components/Form/InputLabel'
import TextareaLabel from '@/components/Form/TextareaLabel'
import ModalAlert from '@/components/Modals/ModalAlert'
import ButtonState from '@/components/Button/ButtonState';
import DatePickerX from '@/components/DatePicker/DatePickerX';

import { encrypt } from '@/utils/helpers'

interface UserData {
    isLogin: boolean;
    data: UserDataProps | null
}

const Cuserinfo = () => {
    const router = useRouter();

    const [validated, setValidated] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [dataUser, setDataUser] = useState<UserData>({ isLogin: false, data: null })

    useEffect(() => {
        const auToken = router.query.auToken
        if (auToken) {
            onGetUserData(auToken as string)
        }
    }, [router.query.auToken])

    const onGetUserData = async (auToken: string) => {
        try {
            const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
            if (responseUser.data?.data) {
                setDataUser({ isLogin: false, data: responseUser.data?.data })
            } else {
                setDataUser({ isLogin: false, data: null })
            }
        } catch (error) {
            console.log("🚀 ~ file: registration.tsx:66 ~ onGetUserData ~ error:", error)
            setDataUser({ isLogin: false, data: null })
            setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง' })
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const form = event.currentTarget;
          
            if (!form.checkValidity()) {
                setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
                return;
            }

            if (form['users_pin'].value.length < 4) {
                setAlert({ show: true, message: 'PIN ต้องมีอย่างน้อย 4 หลัก' });
                return; // Early return if PIN is less than 4 characters
            }

            if (!dataUser.data) {
                return; // Early return if dataUser.data is not available
            }

            const data = {
                users_fname   : form['users_fname'].value,
                users_sname   : form['users_sname'].value,
                users_pin     : Number(form['users_pin'].value),
                users_number  : form['users_number'].value,
                users_moo     : form['users_moo'].value,
                users_road    : form['users_road'].value,
                users_tubon   : form['users_tubon'].value,
                users_amphur  : form['users_amphur'].value,
                users_province: form['users_province'].value,
                users_postcode: form['users_postcode'].value,
                users_tel1    : form['users_tel1'].value,

            }
            setLoading(true)
            const encodedUsersId = encrypt(dataUser.data.users_id.toString());
            await axios.post(`${process.env.WEB_DOMAIN}/api/user/updateUser/${encodedUsersId}`, data)
            onGetUserData(router.query.auToken as string)
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })

        } catch (error) {
            console.error('Error in handleSubmit:', error);
            setLoading(false)
            setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้' })

        } finally {
            setLoading(false);
            setValidated(true);
            event.stopPropagation();
        }
    };

    if (dataUser.isLogin) return <div>loading...</div>;
    return (
        <Container>
            <div className={styles.main}>
                <h1 className="py-2">ข้อมูลผู้ดูแล</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
                    <Form.Group>
                        <InputLabel label="ชื่อ" id="users_fname" placeholder="กรอกชื่อ" required defaultValue={dataUser.data?.users_fname || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="นามสกุล" id="users_sname" placeholder="กรอกนามสกุล" required defaultValue={dataUser.data?.users_sname || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="Pin 4 หลัก" id="users_pin" placeholder="1234" type="number" max={4} required defaultValue={dataUser.data?.users_pin || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เลขที่บ้าน" id="users_number" placeholder="123/12" max={10} defaultValue={dataUser.data?.users_number || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="หมู่" id="users_moo" placeholder="1" max={5} defaultValue={dataUser.data?.users_moo || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ถนน" id="users_road" placeholder="-" defaultValue={dataUser.data?.users_road || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ตำบล" id="users_tubon" placeholder="กรอกตำบล" defaultValue={dataUser.data?.users_tubon || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="อำเภอ" id="users_amphur" placeholder="กรอกอำเภอ" defaultValue={dataUser.data?.users_amphur || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="จังหวัด" id="users_province" placeholder="กรอกจังหวัด" defaultValue={dataUser.data?.users_province || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="รหัสไปรษณีย์" id="users_postcode" placeholder="กรอกรหัสไปรษณีย์" type="number" max={5} defaultValue={dataUser.data?.users_postcode || ''} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เบอร์โทรศัพท์" id="users_tel1" placeholder="กรอกเบอร์โทรศัพท์" max={12} defaultValue={dataUser.data?.users_tel1 || ''} />
                    </Form.Group>

                    <Form.Group className="d-flex justify-content-center py-3">
                        <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
                    </Form.Group>

                </Form>
            </div>
            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
        </Container>
    )
}

export default Cuserinfo