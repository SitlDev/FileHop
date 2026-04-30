import os
import argparse
from generator import generate_tshirt_design

def main():
    parser = argparse.ArgumentParser(description="T-Shirt Design Automation CLI")
    parser.add_argument("--text", type=str, required=True, help="Text to put on the shirt")
    parser.add_argument("--output", type=str, default="generic_design.png", help="Filename for the output")
    parser.add_argument("--folder", type=str, default="outputs/generic", help="Folder to save the design in")
    parser.add_argument("--size", type=int, default=400, help="Font size for the design")

    args = parser.parse_args()

    if not os.path.exists(args.folder):
        os.makedirs(args.folder)

    output_path = os.path.join(args.folder, args.output)
    
    print(f"Generating design for: '{args.text}'...")
    generate_tshirt_design(args.text, output_path, font_size=args.size)
    print(f"Done! Saved to {output_path}")

if __name__ == "__main__":
    main()
