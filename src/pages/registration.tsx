import withCommonData from '@/lib/withCommonData';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';

import styles from '@/styles/page.module.css';

import Form from 'react-bootstrap/Form';

import ButtonState from '@/components/Button/ButtonState';
import InputLabel from '@/components/Form/InputLabel';
import ModalAlert from '@/components/Modals/ModalAlert';

import axios from 'axios';
import md5 from 'md5';

interface UserData {
    isLogin: boolean;
    data: UserDataProps | null
}

const Registration = () => {
    const router = useRouter();

    const [validated, setValidated] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState<string>("");
    const [dataUser, setDataUser] = useState<UserData>({ isLogin: true, data: null });

    useEffect(() => {
        const auToken = router.query.auToken
        if (auToken) {
            onGetUserProfile(auToken as string)
            onGetUserData(auToken as string)
        }
    }, [router.query.auToken])

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
            if (form['users_passwd'].value !== form['users_passwd_comfirm'].value) {
                setAlert({ show: true, message: 'รหัสผ่านไม่ตรงกัน' })
                return;
            }
            if (form['users_pin'].value.length < 4) {
                setAlert({ show: true, message: 'PIN ต้องมีอย่างน้อย 4 หลัก' })
                return;
            }
            if (form['users_passwd'].value === form['users_passwd_comfirm'].value) {
                const data = {
                    users_line_id: router.query.auToken,
                    users_fname: form['users_fname'].value,
                    users_passwd: md5(form['users_passwd'].value),
                    users_pin: form['users_pin'].value,
                    status_id: 1,
                    users_sname: form['users_sname'].value,
                    users_number: form['users_number'].value,
                    users_moo: form['users_moo'].value,
                    users_road: form['users_road'].value,
                    users_tubon: form['users_tubon'].value,
                    users_amphur: form['users_amphur'].value,
                    users_province: form['users_province'].value,
                    users_postcode: form['users_postcode'].value,
                    users_tel1: form['users_tel1'].value,

                }
                setLoading(true)
                await axios.post(`${process.env.WEB_DOMAIN}/api/registration/create`, data)
                onGetUserData(router.query.auToken as string)
                setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })
                setLoading(false)

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
    

    return (
        <Container>
            <div className={styles.main}>
                <Image src={'/images/Logo.png'} width={100} height={100} alt="Logo" priority />
                <h1 className="py-2">ลงทะเบียน</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
                    <Form.Group>
                        <InputLabel label="LINE-USER" id="lineUser" defaultValue={displayName} disabled required />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ชื่อ" id="users_fname" placeholder="กรอกชื่อ" required defaultValue={dataUser.data?.users_fname || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="นามสกุล" id="users_sname" placeholder="กรอกนามสกุล" required defaultValue={dataUser.data?.users_sname || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    {
                        !dataUser.data && (
                            <>
                                <Form.Group>
                                    <InputLabel label="รหัสผ่าน" id="users_passwd" placeholder="กรอกรหัสผ่าน" type="password" required disabled={dataUser.data ? true : false} />
                                </Form.Group>
                                <Form.Group>
                                    <InputLabel label="รหัสผ่าน (อีกครั้ง)" id="users_passwd_comfirm" type="password" placeholder="ยืนยันรหัสผ่าน" required disabled={dataUser.data ? true : false} />
                                </Form.Group>
                            </>
                        )
                    }
                    <Form.Group>
                        <InputLabel label="Pin 4 หลัก" id="users_pin" placeholder="1234" type="number" max={4} required defaultValue={dataUser.data?.users_pin || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เลขที่บ้าน" id="users_number" placeholder="123/12" max={10} defaultValue={dataUser.data?.users_number || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="หมู่" id="users_moo" placeholder="1" max={5} defaultValue={dataUser.data?.users_moo || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ถนน" id="users_road" placeholder="-" defaultValue={dataUser.data?.users_road || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="ตำบล" id="users_tubon" placeholder="กรอกตำบล" defaultValue={dataUser.data?.users_tubon || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="อำเภอ" id="users_amphur" placeholder="กรอกอำเภอ" defaultValue={dataUser.data?.users_amphur || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="จังหวัด" id="users_province" placeholder="กรอกจังหวัด" defaultValue={dataUser.data?.users_province || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="รหัสไปรษณีย์" id="users_postcode" placeholder="กรอกรหัสไปรษณีย์" type="number" max={5} defaultValue={dataUser.data?.users_postcode || ''} disabled={dataUser.data ? true : false} />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label="เบอร์โทรศัพท์" id="users_tel1" placeholder="กรอกเบอร์โทรศัพท์" max={12} defaultValue={dataUser.data?.users_tel1 || ''} disabled={dataUser.data ? true : false} />
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
    title: 'ลงทะเบียน',
    description: 'ลงทะเบียน',
    slug: '',
    titleBar: 'ลงทะเบียน'
});
export default Registration