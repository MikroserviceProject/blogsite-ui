import re

file_path = '/Users/salihacicek/Desktop/tapukadastro/blogsite-ui/src/app/features/auth/profile/profile.component.ts'

with open(file_path, 'r') as f:
    content = f.read()

# 1. isDeactivating signal'ini ProfileComponent sinyalleri arasına ekle
if 'isDeactivating = signal<boolean>(false);' not in content:
    content = content.replace(
        'isRequestingDeletionCode = signal<boolean>(false);',
        'isRequestingDeletionCode = signal<boolean>(false);\n  isDeactivating = signal<boolean>(false);'
    )

# 2. deactivateAccount methodunu ekle
if 'deactivateAccount() {' not in content:
    deactivate_method = """
  deactivateAccount() {
    if (!confirm('Hesabınızı dondurmak istediğinize emin misiniz? Dilediğiniz zaman tekrar giriş yaparak hesabınızı aktifleştirebilirsiniz.')) return;
    this.isDeactivating.set(true);
    this.authService.deactivateAccount().subscribe({
      next: (res) => {
        this.isDeactivating.set(false);
        if(res.success) {
          this.toastService.success('Hesap Donduruldu ❄️', 'Hesabınız başarıyla donduruldu. Çıkış yapılıyor...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.isDeactivating.set(false);
        this.toastService.error('Hata', 'Hesap dondurma işlemi başarısız oldu.');
      }
    });
  }
"""
    # ACCOUNT DELETION yorum satırının üstüne ekleyelim
    content = content.replace('// --- ACCOUNT DELETION ---', deactivate_method + '\n  // --- ACCOUNT DELETION ---')


# 3. Fazladan markAsRead metotlarını temizle
# markAsRead metodu 3 defa eklenmiş olabilir, 1 tanesini bırakmalıyız.
mark_as_read_regex = re.compile(r'  markAsRead\(notif: UserNotification\) \{[\s\S]*?^\s+  \}', re.MULTILINE)
matches = mark_as_read_regex.findall(content)

# Eğer birden fazla varsa, ilkini tutup diğerlerini sil
if len(matches) > 1:
    for match in matches[1:]:
        content = content.replace(match, '')

# 4. (819. satırdaki) editingPost()?.photoUrl hatası (null değerini string'e çevirme sorunu). null check eklenecek.
content = content.replace(
    'this.imageService.getPhotoUrl(editingPost()?.photoUrl)',
    'this.imageService.getPhotoUrl(editingPost()?.photoUrl || undefined)'
)

with open(file_path, 'w') as f:
    f.write(content)

print("Profile component fixed.")
