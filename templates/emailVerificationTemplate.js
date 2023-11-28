const otpTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
		<title>OTP Verification Email</title>
		<style>
			body {
				background-color: #ffffff;
				font-family: Arial, sans-serif;
				font-size: 16px;
				color: #333333;
				margin: 0;
				padding: 0;
				text-align: center;
			}
	
			.container {
				max-width: 600px;
				margin: 0 auto;
				padding: 20px;
			}
	
			.otp {
				font-size: 24px;
				font-weight: bold;
				margin: 20px 0;
			}
		</style>
	</head>
	
	<body>
		<div class="container">
			<div class="otp">${otp}</div>
		</div>
	</body>
	
	</html>
	`;
};

module.exports = otpTemplate;