from PIL import Image

hold = Image.open("hold.png")
hold_mh = Image.open("hold_mh.png")
split_height = int(input("Enter the height of the split: "))
split_height_mh = int(input("Enter the height of the split for the mh: "))

def split(im: Image.Image, fheight: int, theight: int):
    return im.crop((0, fheight, im.width, theight))

split(hold, 0, split_height).save("Hold_End.png")
split(hold_mh, 0, split_height_mh).save("Hold_End_dub.png")
split(hold, split_height, hold.height - split_height).save("Hold_Body.png")
split(hold_mh, split_height_mh, hold_mh.height - split_height_mh).save("Hold_Body_dub.png")
split(hold, hold.height - split_height, hold.height).save("Hold_Head.png")
split(hold_mh, hold_mh.height - split_height_mh, hold_mh.height).save("Hold_Head_dub.png")