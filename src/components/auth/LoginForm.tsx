"use client";
import { startLoginWithCredentials } from "@/app/actions/query/auth";
import {
  ADMIN_DASHBOARD,
  AUTH_REGISTER,
  DASHBOARD,
} from "@/components/constants/frontend-routes";
import { zodResolver } from "@hookform/resolvers/zod";
import CloseIcon from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFormWrapper } from "./AuthFormWrapper";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
  });

  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.data?.user) {
      if (session.data.user.role === "STUDENT") {
        return router.replace(DASHBOARD);
      } else if (session.data.user.role === "ADMIN") {
        router.replace(ADMIN_DASHBOARD);
      }
    }
  }, [session]);

  const [submitCredentialsButtonLoading, setSubmitCredentialsButtonLoading] =
    useState(false);
  // log form state changes

  const onSubmit = async (data: LoginFormData) => {
    setSubmitCredentialsButtonLoading(true);
    const loginResponse = await startLoginWithCredentials(
      data.email,
      data.password
    );
    if (loginResponse.status === "success" && loginResponse.user) {
      if (loginResponse.user.role === "STUDENT") {
        return router.replace(DASHBOARD);
      } else if (loginResponse.user.role === "ADMIN") {
        router.replace(ADMIN_DASHBOARD);
      }
    }
    setSubmitCredentialsButtonLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <AuthFormWrapper
        headerLabel="Login yourself"
        backButtomLabel="Dont have an account yet?"
        backButtonLink={AUTH_REGISTER}
        showSocial
      >
        {errors.root && (
          <Alert icon={<CloseIcon fontSize="inherit" />} severity="error">
            {errors.root.message}
          </Alert>
        )}

        <Box width="100%">
          <TextField
            type="email"
            variant="filled"
            fullWidth
            placeholder="Email"
            label="Email"
            required
            {...register("email", { valueAsNumber: false, required: true })}
          />
          {errors.email && (
            <Alert icon={<CloseIcon fontSize="inherit" />} severity="error">
              {errors.email.message}
            </Alert>
          )}
        </Box>
        <Box width="100%">
          <TextField
            type="password"
            variant="filled"
            fullWidth
            placeholder="Password"
            label="Password"
            required
            {...register("password", { valueAsNumber: false, required: true })}
          />
          {errors.password && (
            <Alert icon={<CloseIcon fontSize="inherit" />} severity="error">
              {errors.password.message}
            </Alert>
          )}
        </Box>
        <Button
          disabled={submitCredentialsButtonLoading}
          startIcon={
            submitCredentialsButtonLoading ? (
              <CircularProgress size={16} />
            ) : (
              <LoginIcon />
            )
          }
          size="large"
          type="submit"
          fullWidth
          variant="contained"
        >
          Submit
        </Button>
      </AuthFormWrapper>
    </form>
  );
}

export const LoginFormSchema = z.object({
  email: z.string().email().min(1, {
    message: "email is required",
  }),
  password: z.string().min(1, {
    message: "password is required",
  }),
});

type LoginFormData = z.infer<typeof LoginFormSchema>;

export type ValidFieldNames = "email" | "password";
