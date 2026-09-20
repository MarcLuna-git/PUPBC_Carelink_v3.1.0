<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(
        AuthService $authService
    ) {
        $this->authService = $authService;
    }

    public function register(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'student_id' => 'required|string|max:50',
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',

                'email' => 'required|email|max:255',

                'password' => 'required|string|min:8|confirmed',

                'birthday' => 'required|date_format:Y-m-d|before_or_equal:today',

                'gender' => 'required|string|max:50',

                'course' => 'required|string|max:255',
                'year' => 'required|string|max:50',
                'section' => 'required|string|max:100',

                'mobile_number' => 'required|string|max:30',
            ]);

            $result = $this->authService
                ->requestRegistrationOtp($data);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function verifyRegistration(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            $result = $this->authService
                ->verifyRegistration(
                    $data['email'],
                    $data['otp']
                );

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'user' => $result['user'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function resendRegistrationOtp(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
            ]);

            $result = $this->authService
                ->resendRegistrationOtp(
                    $data['email']
                );

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'student_id' => 'required|string',
                'birthday' => 'required|date_format:Y-m-d',
                'password' => 'required|string',
            ]);

            $result = $this->authService
                ->login($data);

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'user' => $result['user'],
                'token' => $result['token'],
                'token_type' => $result['token_type'],
                'expires_in' => $result['expires_in'],
                'role' => $result['role'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    public function nurseLogin(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $result = $this->authService
                ->nurseLogin(
                    $data['email'],
                    $data['password']
                );

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'user' => $result['user'],
                'token' => $result['token'],
                'token_type' => $result['token_type'],
                'expires_in' => $result['expires_in'],
                'role' => $result['role'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
            ]);

            $result = $this->authService
                ->forgotPassword($data);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $result = $this->authService
                ->resetPassword($data);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'current_password' => 'required|string',

                'new_password' => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                ],
            ]);

            $result = $this->authService
                ->changePassword($data);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to logout.',
            ], 400);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService
                ->refreshToken();

            return response()->json([
                'success' => true,
                'token' => $result['token'],
                'token_type' => $result['token_type'],
                'expires_in' => $result['expires_in'],
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to refresh token.',
            ], 401);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = $this->authService
                ->getAuthenticatedUser();

            return response()->json([
                'success' => true,
                'user' => $user,
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }
    }
}