10. Network Access Configuration
Allow Windows Firewall:
REM Add to setup.bat
netsh advfirewall firewall add rule name="Invoice System HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Invoice System HTTPS" dir=in action=allow protocol=TCP localport=443
