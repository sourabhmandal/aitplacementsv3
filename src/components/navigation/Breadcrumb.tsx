"use client";
import { DASHBOARD } from "@/components";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useState } from "react";

interface BreadcrumbProps {
  path: string;
}
export function Breadcrumb({ path }: BreadcrumbProps) {
  // Parse the current path from the router
  const [pathname, setPathname] = useState<Array<string>>(["/"]);

  useEffect(() => {
    if (window) setPathname(path.split("/").filter((x) => x));
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderBottom: 1,
        padding: 2,
        borderColor: "divider",
        height: 57,
        display: "flex",
        alignItems: "center",
      }}
    >
      <NextLink href={DASHBOARD} passHref>
        <Link
          underline="hover"
          color="text.info"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
        </Link>
      </NextLink>
      <ArrowForwardIosIcon
        sx={{ mx: 0.5, color: "text.secondary" }}
        fontSize="inherit"
      />

      {/* Dynamically generate breadcrumbs from the path */}
      {pathname.map((value, index) => {
        // Build the path to this point
        const href = "/" + pathname.slice(0, index + 1).join("/");

        // Capitalize and replace hyphens with spaces for display
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        let label: string = "";
        if (uuidRegex.test(value)) {
          label = value;
        } else {
          label = value
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        // Determine if the current link is the last in the list
        const isLast = index === pathname.length - 1;

        return isLast ? (
          <Typography key={href} color="text.secondary" variant="body1">
            {label}
          </Typography>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center">
            <NextLink key={href} href={href} passHref>
              <Link underline="hover" color="inherit">
                {label}
              </Link>
            </NextLink>
            <ArrowForwardIosIcon
              sx={{ mx: 0.5, color: "GrayText", fontSize: "small" }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
