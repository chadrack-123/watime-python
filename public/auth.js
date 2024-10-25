function auth() {
    return {
        email: '',
        password: '',
        confirmPassword: '',
        loginEmail: '',
        loginPassword: '',
        message: '',

        async signup() {
            if (this.password !== this.confirmPassword) {
                this.message = "Passwords do not match!";
                return;
            }

            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password,
                }),
            });
            const data = await response.json();
            this.message = data.message || data.error;
        },

        async login() {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.loginEmail,
                    password: this.loginPassword,
                }),
            });
            const data = await response.json();
            console.log('Response data:', data); // Log the response data
            if (data.redirect) {
                console.log('Redirecting to:', data.redirect); // Log before redirecting
                window.location.href = data.redirect;
            } else {
                this.message = data.message || data.error;
            }
        },
    };
}
