import socket

def get_local_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"

ip = get_local_ip()
print(f"Твой локальный IP: {ip}")
print(f"Адрес сервера: http://{ip}:8000")
