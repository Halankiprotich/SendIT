import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../shared/toast/toast.service';
import { AuthService, CreateUserDto } from '../../services/auth.service';
import { ParcelsService, Parcel } from '../../services/parcels.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  showPassword = false;
  isLoading = false;
  checkingParcels = false;
  anonymousParcels: Parcel[] = [];
  showParcelsFound = false;

  // Separate name fields
  firstName = '';
  lastName = '';

  signupData: CreateUserDto = {
    name: '', // will be set during submission
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER'
  };

  constructor(
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    private parcelsService: ParcelsService
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onEmailChange() {
    if (this.signupData.email && this.isValidEmail(this.signupData.email)) {
      this.checkAnonymousParcels();
    } else {
      this.anonymousParcels = [];
      this.showParcelsFound = false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private checkAnonymousParcels() {
    this.checkingParcels = true;
    this.parcelsService.getAnonymousParcels(this.signupData.email).subscribe({
      next: (parcels) => {
        this.checkingParcels = false;
        this.anonymousParcels = parcels;
        this.showParcelsFound = parcels.length > 0;

        if (parcels.length > 0) {
          this.toastService.showInfo(`Found ${parcels.length} parcel(s) linked to this email.`);
        }
      },
      error: (error) => {
        this.checkingParcels = false;
        console.error('Error checking anonymous parcels:', error);
      }
    });
  }

  onSubmit() {
    // Combine names
    const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`;
    this.signupData.name = fullName;

    // Validate required fields
    if (!this.firstName || !this.lastName || !this.signupData.email || !this.signupData.password || !this.signupData.phone) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    if (!this.isValidEmail(this.signupData.email)) {
      this.toastService.showError('Please enter a valid email');
      return;
    }

    if (this.signupData.password.length < 6) {
      this.toastService.showError('Password must be at least 6 characters');
      return;
    }

    if (fullName.length < 2) {
      this.toastService.showError('Full name must be at least 2 characters');
      return;
    }

    this.isLoading = true;

    this.authService.register(this.signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (this.anonymousParcels.length > 0) {
          this.toastService.showSuccess(`Account created. ${this.anonymousParcels.length} parcel(s) linked.`);
        } else {
          this.toastService.showSuccess('Account created. Please log in.');
        }
        this.redirectBasedOnRole(response.user.role);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration failed:', error);
        // Toast handled in AuthService
      }
    });
  }

  private redirectBasedOnRole(role: string) {
    this.router.navigate(['/login']);
  }
}
