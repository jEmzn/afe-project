import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import Modal from 'react-bootstrap/Modal';

interface Props {
    show: boolean;
    message: string;
    handleClose: () => void;
}

const ModalAlert = ({ show, message, handleClose }: Props) => {

    return (
        <>
            <Modal show={show} centered onHide={() => handleClose()}>
                <Modal.Header className="py-2">
                    <h5 className="m-0">{'SEPAW'}</h5>
                    <button type="button" className="btn outline" style={{ fontSize: 20 }} onClick={() => handleClose()}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <p>{message}</p>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ModalAlert