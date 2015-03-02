#winrmjs

Basically just the same as WinRB/winRM and pywinrm, but in Javascript. It allows you to invoke commands on Windows hosts from any machine with nodejs.

Unfortunately it only works with Basic authentication over HTTP at the moment, but this will eventually change so it works with Kerberos and HTTPS.

###Enable WinRM on remote hosts

Again, this is very insecure. This will change. Run these on the remote host.

```
winrm set winrm/config/client/auth @{Basic="true"}
winrm set winrm/config/service/auth @{Basic="true"}
winrm set winrm/config/service @{AllowUnencrypted="true"}
```
