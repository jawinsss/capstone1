export declare class LoginDto {
    username: string;
    password: string;
    isAdmin?: boolean;
}
export declare class RegisterDto {
    fullName: string;
    email: string;
    phone?: string;
    username: string;
    password: string;
    confirmPassword: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        role: string;
    };
}
