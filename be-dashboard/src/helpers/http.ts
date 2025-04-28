import * as statusCodes from '../shared/constants/httpCodes';

export interface Response<T> {
    statusCode: Number;
    message: string;
    data?: T;
    error?: string;
    count?: number;
}

export const success = (data: any, count = 0): Response<any> => {
    if (count > 0) {
        return {
            statusCode: statusCodes.SUCCESS,
            message: 'Success',
            data: data,
            count: count,
        };
    } else {
        return {
            statusCode: statusCodes.SUCCESS,
            message: 'Success',
            data: data,
        };
    }
};

export const dataNotFound = (message = 'Data not found'): Response<any> => {
    return {
        statusCode: statusCodes.NO_DATA_FOUND,
        message: message,
        data: [],
    };
};

export const notFound = (message = 'Not found'): Response<any> => {
    return {
        statusCode: statusCodes.NOT_FOUND,
        message: message,
        data: [],
    };
};

export const serverError = (
    error = 'An Error Occurred. Please contact an admin.'
): Response<any> => {
    return {
        statusCode: statusCodes.ERROR,
        message: error,
        data: [],
        error: 'Internal Server error',
    };
};

export const requestInvalid = (message: string): Response<any> => {
    return {
        statusCode: statusCodes.REQUEST_ERROR,
        message: message,
        data: [],
        error: 'Bad Request',
    };
};

export const notAllowed = (
    message = 'You are not allowed to do this operation'
): Response<any> => {
    return {
        statusCode: statusCodes.NOT_ALLOWED,
        message: message,
        data: [],
        error: 'Not allowed',
    };
};

export const notAuthorized = (
    message = 'You are not authorized to do this operation'
): Response<any> => {
    return {
        statusCode: statusCodes.UNAUTHORIZED,
        message: message,
        data: [],
        error: 'Not Authorized',
    };
};

export const conflict = (message: string): Response<any> => {
    return {
        statusCode: statusCodes.CONFLICT,
        message: message,
        data: [],
        error: 'Duplicate Value',
    };
};

export const inactive = (message: string): Response<any> => {
    return {
        statusCode: statusCodes.INACTIVE,
        message: message,
        data: [],
        error: 'Inactive',
    };
};
