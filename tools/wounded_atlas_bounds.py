from PIL import Image

path = r"C:\Users\Duanyang Home\Documents\ChatGPT\sanguo\assets\wounded-units-atlas-v1.png"
image = Image.open(path).convert("RGBA")
ids = ["liu", "guan", "zhang", "gongsun", "tao", "hua", "lvbu", "zhangliao", "houcheng", "songxian", "weixu", "infantry", "archer", "officer"]

for index, unit_id in enumerate(ids):
    column = index % 4
    row = index // 4
    x0 = round(column * image.width / 4)
    x1 = round((column + 1) * image.width / 4)
    y0 = round(row * image.height / 4)
    y1 = round((row + 1) * image.height / 4)
    alpha = image.crop((x0, y0, x1, y1)).getchannel("A")
    bounds = alpha.getbbox()
    print(unit_id, [x0, y0, x1 - x0, y1 - y0], bounds)
