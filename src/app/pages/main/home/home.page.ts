import { Component, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.models';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  products: Product[] = [];
  loading: boolean = false;

  ngOnInit() {}

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();
  }

  doRefresh(event) {
    setTimeout(() => {
      this.getProducts();
      event.target.complete();
    }, 1000);
  }

  // ============= Obtener ganancias =============
  getProfits(){
    return this.products.reduce((index, product) => index + product.price * product.soldUnits, 0);
  }

  // ============= Obtener productos =============
  getProducts() {
    let path = `users/${this.user().uid}/products`;

    this.loading = true;

    let query = [
      orderBy('soldUnits','desc')
    ]

    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;

        this.loading = false;

        sub.unsubscribe();
      },
    });
  }

  // ========== Agregar o Actualizar producto ========
  async addUpdateProduct(product?: Product) {
    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product },
    });

    if (success) this.getProducts();
  }


// ========== Confirmar eliminacion del producto ========
  async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Eliminar Producto',
      message: '¿Quieres eliminar este producto',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        }, {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteProduct(product)
          }
        }
      ]
    });

  }


  // =====Eliminar producto =====
  async deleteProduct(product: Product) {
    let path = `users/${this.user().uid}/products/${product.id}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    let imagePath = await this.firebaseSvc.getFilePath(product.image);
    await this.firebaseSvc.deleteFile(imagePath);

    this.firebaseSvc.deleteDocument(path).then(async (res) => {

      this.products = this.products.filter(p => p.id !== product.id);

        this.utilsSvc.presentToast({
          message: 'Producto eliminado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  generatePDF() {
    const doc = new jsPDF();
    doc.text('Detalles de los Productos', 10, 10);
    let yOffset = 20;
    this.products.forEach((product, index) => {
      yOffset += 10;
      doc.text(`Producto ${index + 1}:`, 10, yOffset);
      doc.text(`Nombre: ${product.name}`, 20, yOffset + 10);
      doc.text(`Precio: ${product.price}`, 20, yOffset + 20);
      doc.text(`Unidades Vendidas: ${product.soldUnits}`, 20, yOffset + 30);
      yOffset += 40;
    });
    doc.save('productos.pdf');
  }
  
}
