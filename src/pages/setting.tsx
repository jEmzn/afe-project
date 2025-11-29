"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

import {
  GoogleMap,
  Marker,
  useLoadScript,
  InfoWindow,
  DrawingManager,
  Polygon,
  Circle,
} from "@react-google-maps/api";
import Spinner from "react-bootstrap/Spinner";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Form } from "react-bootstrap";

import ButtonState from "@/components/Button/ButtonState";
import ModalAlert from "@/components/Modals/ModalAlert";
import RangeSlider from "@/components/RangeSlider/RangeSlider";
import { encrypt } from "@/utils/helpers";

import styles from "@/styles/page.module.css";

interface Location {
  latitude: number;
  longitude: number;
}

interface DataUserState {
  isLogin: boolean;
  userData: any | null;
  takecareData: any | null;
}

interface SafezoneStage {
  takecare_id: number;
  users_id: number;
  safezone_id?: number;
  safez_latitude: string;
  safez_longitude: string;
  safez_radiuslv1: number;
  safez_radiuslv2: number;
//   status_tracking_on: boolean;
}
const Setting = () => {
  const router = useRouter();

  const containerStyle = {
    width: "100vw",
    height: "50vh",
  };

  const [mapRef, setMapRef] = useState();
  const [infoWindowData, setInfoWindowData] = useState({
    id: 0,
    address: "",
    show: false,
  });

  const [location, setLocation] = useState<Location>({
    latitude: 13.89,
    longitude: 100.5993555,
  });

  const [alert, setAlert] = useState({ show: false, message: "" });
  const [isLoading, setLoading] = useState(false);
  const [range1, setRange1] = useState(10);
  const [range2, setRange2] = useState(20);
  const [dataUser, setDataUser] = useState<DataUserState>({
    isLogin: false,
    userData: null,
    takecareData: null,
  });
  const [idSafezoneStage, setIdSafezoneStage] = useState(0);
  const [isZoneActive, setIsZoneActive] = useState<boolean>(false);

  useEffect(() => {
    const auToken = router.query.auToken;
    // const idSafezone = router.query.idsafezone

    if (auToken) {
      onGetUserData(auToken as string);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  }, [router.query.auToken]);

  const onGetSafezone = async (
    idSafezone: string,
    takecareData: any,
    userData: any
  ) => {
    try {
      const resSafezone = await axios.get(
        `${process.env.WEB_DOMAIN}/api/setting/getSafezone?takecare_id=${takecareData.takecare_id}&users_id=${userData.users_id}&id=${idSafezone}`
      );
      if (resSafezone.data?.data) {
        const data = resSafezone.data?.data;
        setLocation({
          latitude: Number(data.safez_latitude),
          longitude: Number(data.safez_longitude),
        });
        setRange1(data.safez_radiuslv1);
        setRange2(data.safez_radiuslv2);
        setIdSafezoneStage(Number(idSafezone));
        setIsZoneActive(data.status_tracking_on); // set  setIsZoneActive() from status_tracking_on in database
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: registration.tsx:66 ~ onGetUserData ~ error:",
        error
      );
      setDataUser({ isLogin: false, userData: null, takecareData: null });
      setAlert({
        show: true,
        message: "ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const onGetUserData = async (auToken: string) => {
    try {
      const responseUser = await axios.get(
        `${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`
      );
      if (responseUser.data?.data) {
        const encodedUsersId = encrypt(
          responseUser.data?.data.users_id.toString()
        );

        const responseTakecareperson = await axios.get(
          `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`
        );
        const data = responseTakecareperson.data?.data;
        if (data) {
          setDataUser({
            isLogin: false,
            userData: responseUser.data?.data,
            takecareData: data,
          });
          const idSafezone = router.query.idsafezone;
          if (Number(idSafezone) > 0) {
            onGetSafezone(idSafezone as string, data, responseUser.data?.data);
          }
        } else {
          alertModal();
        }
      } else {
        alertModal();
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: registration.tsx:66 ~ onGetUserData ~ error:",
        error
      );
      setDataUser({ isLogin: false, userData: null, takecareData: null });
      setAlert({
        show: true,
        message: "ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const alertModal = () => {
    setAlert({
      show: true,
      message: "ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง",
    });
    setDataUser({ isLogin: false, userData: null, takecareData: null });
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.GoogleMapsApiKey as string,
  });
  const center = useMemo(
    () => ({ lat: location.latitude, lng: location.longitude }),
    [location]
  );

  const handleMarkerClick = (
    id: number,
    lat: number,
    lng: number,
    address: string
  ) => {
    //     mapRef?.panTo({ lat, lng });
    setInfoWindowData({ id, address, show: true });
  };
  const handleSave = async () => {
    try {
      setLoading(true);
      if (dataUser.takecareData && dataUser.userData) {
        let data: SafezoneStage = {
          takecare_id: dataUser.takecareData.takecare_id,
          users_id: dataUser.userData.users_id,
          safez_latitude: location.latitude.toString(),
          safez_longitude: location.longitude.toString(),
          safez_radiuslv1: range1,
          safez_radiuslv2: range2,
        };
        if (idSafezoneStage > 0) {
          data["safezone_id"] = idSafezoneStage;
        }
        const res = await axios.post(
          `${process.env.WEB_DOMAIN}/api/setting/saveSafezone`,
          data
        );
        if (res.data?.id) {
          router.push(
            `/setting?auToken=${router.query.auToken}&idsafezone=${res.data.id}`
          );
        }
        setAlert({ show: true, message: "บันทึกข้อมูลสำเร็จ" });
      }
      setLoading(false);
    } catch (error) {
      setAlert({ show: true, message: "ไม่สามารถบันทึกข้อมูลได้" });
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLocation({
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
      });
    }
  };
  const polygonOptions = {
    strokeColor: "yellow",
    strokeOpacity: 0.5,
    strokeWeight: 3.0,
    fillColor: "red",
    fillOpacity: 0.2,
  };

  //======= Toggle Switch : เปิด/ปิดระบบตรวจจับการออกนอกเขต ======
  

  const handleToggleStatus = async (checked: boolean) => {
    // A. เปลี่ยนหน้าจอทันทีให้ user รู้สึกไว (Optimistic UI)
    setIsZoneActive(checked);

    try {
      // B. ส่งข้อมูลไปหลังบ้าน (API)
      const response = await fetch("/api/setting/toggleSafezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uId: dataUser.userData.users_id, // ส่ง ID 1
          takecare_id: dataUser.takecareData.takecare_id, // ส่ง ID 2
          status: checked, // ส่งสถานะ (เปิด/ปิด)
        }),
      });

      if (!response.ok) throw new Error("Update failed");
    } catch (error) {
      console.error(error);
      // C. ถ้าพัง! ให้ดีดสวิตช์กลับคืนค่าเดิม
      setIsZoneActive(!checked);
    //   alert("บันทึกไม่สำเร็จ");
    }
  };

  return (
    <>
      {!isLoaded ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <div style={{ height: "50vh" }}>
            <GoogleMap
              clickableIcons={false}
              mapContainerStyle={containerStyle}
              center={center}
              zoom={20}
              options={{
                mapTypeControl: true,
                streetViewControl: false,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.LEFT_CENTER,
                },
              }}
              onClick={(e) => onMapClick(e)}
            >
              <Marker
                position={{ lat: location.latitude, lng: location.longitude }}
                icon={{
                  url: "https://maps.google.com/mapfiles/kml/pal2/icon10.png",
                  scaledSize: new window.google.maps.Size(35, 35),
                }}
              >
                <>
                  <Circle
                    center={{ lat: location.latitude, lng: location.longitude }}
                    radius={range1}
                    options={{
                      fillColor: "#F2BE22",
                      strokeColor: "#F2BE22",
                      fillOpacity: 0.2,
                    }}
                  />
                  <Circle
                    center={{ lat: location.latitude, lng: location.longitude }}
                    radius={range2}
                    options={{
                      fillColor: "#F24C3D",
                      strokeColor: "#F24C3D",
                      fillOpacity: 0.1,
                    }}
                  />
                </>
              </Marker>
            </GoogleMap>
          </div>

          <Container className="py-3">
            {/*ปุ่มเปิดปิดการตรวจจับออกนอกเขต*/}
            <Row className="mb-2">
              {/* mb-2 เว้นระยะห่างจากปุ่ม Save เล็กน้อย */}
              <Col
                sm={12}
                className="d-flex justify-content-end align-items-center"
              >
                <span
                  className="me-2"
                  style={{
                    fontSize: "14px",
                    color: isZoneActive ? "#28a745" : "#6c757d", // สีเขียวเมื่อเปิด, สีเทาเมื่อปิด
                    fontWeight: isZoneActive ? "bold" : "normal",
                  }}
                >
                  {isZoneActive
                    ? "เปิดแจ้งเตือนเมื่อออกนอกเขต"
                    : "ปิดแจ้งเตือนเมื่อออกนอกเขต"}
                </span>
                <Form.Check
                  type="switch"
                  id="zone-alert-switch"
                  checked={isZoneActive}
                  onChange={(e) => handleToggleStatus(e.target.checked)}
                  style={{ transform: "scale(1.2)" }} // ขยายสวิตช์ให้กดง่ายขึ้นเล็กน้อย
                />
              </Col>
            </Row>
            <Row>
              <Col sm={12}>
                <p>คำแนะนำ : กรุณาเดินไปยังจุดที่ต้องการตั้งค่าจุดปลอดภัย</p>
              </Col>
            </Row>
            <Row className="py-3">
              <Col sm={12}>
                <p>
                  รัศมี เขตปลอดภัย ชั้นที่ 1 :{" "}
                  <span style={{ fontSize: 20, color: "#000" }}>{range1}</span>{" "}
                  (เมตร)
                </p>
                <RangeSlider
                  max={range2}
                  value={range1}
                  onChange={(e) => setRange1(e)}
                />
              </Col>
            </Row>
            <Row className="py-3">
              <Col sm={12}>
                <p>
                  รัศมี เขตปลอดภัย ชั้นที่ 2 :{" "}
                  <span style={{ fontSize: 20, color: "#000" }}>{range2}</span>{" "}
                  (เมตร)
                </p>
                <RangeSlider
                  min={range1}
                  value={range2}
                  onChange={(e) => setRange2(e)}
                  typeClass={2}
                />
              </Col>
            </Row>
            {dataUser.takecareData && dataUser.userData ? (
              <>
                <Row>
                  <Col sm={12}>
                    <ButtonState
                      className={styles.button}
                      text={"บันทึก"}
                      icon="fas fa-save"
                      isLoading={isLoading}
                      onClick={() => handleSave()}
                    />
                  </Col>
                </Row>
              </>
            ) : null}
          </Container>
          <ModalAlert
            show={alert.show}
            message={alert.message}
            handleClose={() => setAlert({ show: false, message: "" })}
          />
        </>
      )}
    </>
  );
};

export default Setting;
