import backgroundImage from '../resources/sprites/background-day.png';

class Game {
	canvas: HTMLCanvasElement | null = null;
	context: CanvasRenderingContext2D | null = null;

	constructor() {
		this.canvas = <HTMLCanvasElement>document.querySelector('#canvas');
		this.context = this.canvas.getContext('2d');
	}

	setBackground(): void {
		const background = new Image();
		background.onload = () => {
			this.context!.drawImage(background, 0, 0, 288, 512);
		};
		background.src = backgroundImage;
	}

	run() {
		if (!this.context) {
			return;
		}

		this.setBackground();
	}
}

const slempyBirb = new Game();
slempyBirb.run();