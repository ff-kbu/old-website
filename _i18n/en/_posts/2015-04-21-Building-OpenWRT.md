---
layout: default
title: "Building OpenWRT"
author: "yanosz"
date: 2015-04-21 21:00:00
---
#### What is this about?
Freifunk Firmware is distributed via firmware image files - usually. It's plug and play for the user: Fire up a browser, open your router's WebUI, upload a it and you're done. But how to create theses images? Is there room for tinkering?
Usually, every Freifunk-Firmware uses OpenWRT / Linux. Thats the big common ground for all networks out there.

<!--break-->

OpenWRT is a specialized Linux distribution focusing on wifi routers - but out-of-the stock releases builds cannot be used, 'cause every community must ship their network configuration. This blog post explains how to create custom firmware images. It provides a detailed view on http://wiki.openwrt.org/doc/howto/obtain.firmware while having Freifunk in mind.


####Make It - The Buildroot
OpenWRT features a build system (aka Buildroot - http://wiki.openwrt.org/doc/howto/build). It is used to build OpenWRT from source, completely. I use it like this:
{% highlight bash %}
$ git clone git://git.openwrt.org/openwrt.git
$ cd openwrt
$ scripts/feeds update -a && scripts/feeds install -a
$ make menuconfig  # Select all options you need
$ make clean install
{% endhighlight %}
Afterwards, firmware images will be in <code>./bin/</code> - Keep calm and carry one:

- If it fails, try again using <code>make V=99</code>.
- To speed up, use more cores: <code>make -j 8</code>.There'll be dragons.

Note that all selected packages will be installed in each firmware image file: If you select USB-drivers, they will be available on models without USB. If you skip 'em, they'll be missing on models having USB.

####Alternatives
Using the Buildroot is annoying. You have to wait a looooong time for the build to finish. Each and every dependency is downloaded, checked, extracted, built and installed. If one thing screws up, the build breaks.
But there's more. If you try to install OpenWRT's packages on machines running your build, you may run into trouble.
{% highlight bash %}
root@OpenWRT:~# opkg install kmod-usb-storage
Installing kmod-usb-storage (3.10.49-1) to root...
Downloading http://downloads.openwrt.org/barrier_breaker/14.07/ar71xx/generic/packages/base/kmod-usb-storage_3.10.49-1_ar71xx.ipk.
Collected errors:
 * satisfy_dependencies_for: Cannot satisfy the following dependencies for kmod-usb-storage:
 *      kernel (= 3.10.49-1-0114c71ed85677c9c1e4911437af4743)
 * opkg_install_cmd: Cannot install package kmod-usb-storage.
root@OpenWRT:~# opkg list-installed kernel
kernel - 3.10.49-1-a785eb58641150b9f09fe8279e1cde49

{% endhighlight %}
In OpenWRT all kernel features are encoded in the kernel's version number. If you change anything, it breaks. You cannot use other build's kernel packages.


Luckily, there are other options:

- The <a target="_blank" href="http://wiki.openwrt.org/doc/howto/obtain.firmware.sdk">OpenWRT SDK</a> for compiling software
- The <a target="_blank" href="http://wiki.openwrt.org/doc/howto/obtain.firmware.generate">Image Builder</a> for creating firmware image files

Both are created when compiling the Buildroot. Furthermore, they're included in all official releases of OpenWRT. By using 'em, you're able to create images based on released kernel configurations. The version-number-issue disappears.



##### The OpenWRT SDK
The SDK is used for building packages - in contrast to complete firmware files. Starting with OpenWRT 14.07 (Barrier Breaker) it is possible to build kernel packages, too. Platform-dependent, binary versions are provided by OpenWRT for their stock releases.

Let’s compile a pre-release of olsr v2 (tag: v0.7.1) to be used on a TP-Link WR841n:
{% highlight bash %}
$ wget https://downloads.openwrt.org/barrier_breaker/14.07/ar71xx/generic/OpenWrt-SDK-ar71xx-for-linux-x86_64-gcc-4.8-linaro_uClibc-0.9.33.2.tar.bz2
$ tar xjf OpenWrt-SDK-ar71xx-for-linux-x86_64-gcc-4.8-linaro_uClibc-0.9.33.2.tar.bz2
$ cd OpenWrt-SDK-ar71xx-for-linux-x86_64-gcc-4.8-linaro_uClibc-0.9.33.2
$ git clone git://olsr.org/oonf.git -b v0.7.1 package/oonf
$ make world
{% endhighlight %}
Looking into <code>./ar71xx/packages/base</code>, there's a complete <a href="http://wiki.openwrt.org/doc/techref/opkg">opkg-feed</a>. Just copy it to a web server, put it in your router's <code>/etc/opkg.conf</code> and use it.

#####Image Builder

The Image Builder is for creating firmware images to be uploaded on routers. Sometimes it's called Image Generator. It's for post-processing a Buildroot-output - such as an OpenWRT stock release. You can select packages and files to be included. Creating a minimal image including the previous olsr v2 build for a TP-Link WR841n works like this:
{% highlight bash %}
$ wget https://downloads.openwrt.org/barrier_breaker/14.07/ar71xx/generic/OpenWrt-ImageBuilder-ar71xx_generic-for-linux-x86_64.tar.bz2
$ tar xjf OpenWrt-ImageBuilder-ar71xx_generic-for-linux-x86_64.tar.bz2
$ cd OpenWrt-ImageBuilder-ar71xx_generic-for-linux-x86_64
$ #### Append to repositories.conf: src/gz my_packages https://your.web.server/uploaded/sdk_output/
$  make image PROFILE=TLWR841 PACKAGES="olsrv2"
{% endhighlight %}
Result is: <code>./bin/ar71xx/openwrt-ar71xx-generic-tl-wr841n*</code>. Keep in mind that <code>make profile</code> gives a list of all available profiles for the sdk's platform. There are generic ones, too.

#### Summary
OpenWRT's build system appears redundant. Both SDK and Image Builder do serve their purpose and have justified use cases.
For generating Freifunk-Firmware, SDK + Imagebuilder seem to be a reasonable choice: Software packages released by OpenWRT can be used and post-processing allows including USB-drivers only for models having USB. Building a non-released version of OpenWRT (trunk, stable branch) seems to be one of the few cases, where you actually need the Buildroot.

|  Feature                                                            | Buildroot     | SDK            | Image Builder         |
| --------------------------------------------------------------------|:-------------:|:--------------:|:---------------------:|
| Purpose  	                                                          | Do everything | Build packages | Create firmware files |
| Turnaround time                                                     | Slow          | Fast           | Fast                  |
| Build stability                                                     | Unstable      | Stable         | Stable                |
| Space needed for building - Freifunk scenario                       | 9647 MB       | 398 MB         | 402 MB                |
| Use unreleased (patched) versions of OpenWRT's core packages        | ✔             | ❌              | ❌                     |
| Build 3rd party software                                            | ✔ 		      | ✔              | ❌                     |
| Build 3rd party kernel modules for OpenWRT stock releases           | ❌             | ✔              | ❌                     |
| Create opkg-feed directories                                        | ✔             | ✔              | ❌                     |
| Create firmware image files (.bin / .trx)                           | ✔             | ❌              | ✔                     |
| Post-process builds according to target devices (ie add USB-drivers)| ❌             | ❌              | ✔                     |
| Re-pack (KBU-)firmware releases for other communities               | ❌             | ❌              | ✔                     |



One of the next posts will be on doing release builds for KBU - but this is a different story. In the meantime: try to build your community's firmware by yourself.

That's it - Happy Hacking.
