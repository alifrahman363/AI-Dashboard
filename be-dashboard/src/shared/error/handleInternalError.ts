import { Response } from 'express'
import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

export const handleInternalError = (error: any, res: Response) => {
    return res.status(500).json({
        error: error.message,
        message: 'Internal Server Error'
    })
}
