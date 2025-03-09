"use client";
import Image from "next/image";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@heroui/react";

export default function Home() {
  return (
    <div className="text-white">
      <Navbar shouldHideOnScroll className="p-4">
        <NavbarBrand>
          {/* <AcmeLogo /> */}
          <p className="font-bold text-inherit">Muscify</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link color="foreground" href="#">
              Features
            </Link>
          </NavbarItem>
          {/* <NavbarItem isActive>
            <Link aria-current="page" href="#">
              Customers
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Integrations
            </Link>
          </NavbarItem> */}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem className="hidden lg:flex">
            <Link href="/login">Login</Link>
          </NavbarItem>
          <NavbarItem>
            <Button as={Link} color="primary" href="#" variant="flat">
              Sign Up
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <section className="flex flex-col justify-center items-center h-svh">
        <div>
          <h1 className=" text-[10rem]">
            Welcome to{" "}
            <span className="font-bold primary-text text-[#bca6cf]">
              Musify.
            </span>
          </h1>
        </div>
      </section>
      <section className="flex flex-col justify-center items-center h-svh">
        <div>
          <h1 className=" text-[10rem]">
            Welcome to{" "}
            <span className="font-bold primary-text text-[#bca6cf]">
              Musify.
            </span>
          </h1>
        </div>
      </section>

      <section className="flex flex-col justify-center items-center h-svh">
        <div className="w-full h-screen">
          {/* i will put model stuff here */}
        </div>
      </section>
    </div>
  );
}
