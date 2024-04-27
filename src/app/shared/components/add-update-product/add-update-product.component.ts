import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.models';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})
export class AddUpdateProductComponent  implements OnInit {

  @Input() product: Product


  form = new FormGroup({
    id: new FormControl(''),
    image: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    price: new FormControl(null, [Validators.required, Validators.min(0)]),
    soldUnits: new FormControl(null, [Validators.required, Validators.min(0)]),
  });

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  user = {} as User;
  

  nombre: string;
  codigoIngreso: string;
  colorAutomovil: string;
  numeroPlaca: string;



  ngOnInit() {

    this.user = this.utilsSvc.getFromLocalStorage('user');
    if(this.product) this.form.setValue(this.product);
  }


  //======== Tomar/Seleccionar Imagen ========
  async takeImage(){
    const dataUrl = (await this.utilsSvc.takePicture('Imagen del producto')).dataUrl;
    this.form.controls.image.setValue(dataUrl);
  }

  submit(){
    if (this.form.valid){

      if (this.product) this.updateProduct();
      else this.createProduct()

    }

  }

   // ===== Convierte valores de tipo string a number =====
  setNumberInputs(){

    let { soldUnits, price } = this.form.controls;

    if (soldUnits.value) soldUnits.setValue(parseFloat(soldUnits.value));
    if (price.value) price.setValue(parseFloat(price.value));

  }

  // ===== Crear producto =====
  async createProduct() {

      let path = `users/${this.user.uid}/products`

      const loading = await this.utilsSvc.loading();
      await loading.present();

      // ===== subir la imagen y obtener la url =====
      let dataUrl = this.form.value.image;
      let imagePath = `${this.user.uid}/${Date.now()}`;
      let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
      this.form.controls.image.setValue(imageUrl);

      delete this.form.value.id

      this.firebaseSvc.addDocument(path, this.form.value).then(async res  =>{

        this.utilsSvc.dismissModal({ success: true });

        this.utilsSvc.presentToast({
          message: 'Producto creado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        })

      }).catch(error =>{
        console.log(error);

      }).finally(() => {
        loading.dismiss();
      })

  }

      // ===== Actualizar producto =====
  async updateProduct() {

      let path = `users/${this.user.uid}/products/${this.product.id}`

      const loading = await this.utilsSvc.loading();
      await loading.present();

      // ===== se cambia la imagen, subir nueva imagen y obtener la url =====
      if(this.form.value.image != this.product.image){
        let dataUrl = this.form.value.image;
        let imagePath = await this.firebaseSvc.getFilePath(this.product.image);
        let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
        this.form.controls.image.setValue(imageUrl);
      }

      delete this.form.value.id

      this.firebaseSvc.updateDocument(path, this.form.value).then(async res  =>{

        this.utilsSvc.dismissModal({ success: true });

        this.utilsSvc.presentToast({
          message: 'Producto actualizado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        })

      }).catch(error =>{
        console.log(error);

      }).finally(() => {
        loading.dismiss();
      });


  }



generatePDF() {
    const doc = new jsPDF();
    doc.text('Detalles del Producto', 10, 10);
    doc.text(`Nombre: ${this.form.value.name}`, 10, 20);
    doc.text(`Precio: ${this.form.value.price}`, 10, 30);
    doc.text(`Unidades Vendidas: ${this.form.value.soldUnits}`, 10, 40);
    doc.save('producto.pdf');
  }


  submitForm() {
    console.log('Nombre:', this.nombre);
    console.log('Código de ingreso:', this.codigoIngreso);
    console.log('Color de automóvil:', this.colorAutomovil);
    console.log('Número de placa:', this.numeroPlaca);
    console.log('Hora de entrada:', this.horaEntrada);
    console.log('Hora de salida:', this.horaSalida);
  
    // Aquí puedes agregar la lógica para enviar los datos a través de una API o realizar alguna otra acción.
    // Por ejemplo, si tienes un servicio para enviar los datos a través de una API, puedes llamarlo aquí.
  
    // Si deseas enviar los datos a través de una API utilizando Angular HttpClient, sería algo como:
    // this.httpClient.post('URL_DE_TU_API', {
    //   nombre: this.nombre,
    //   codigoIngreso: this.codigoIngreso,
    //   colorAutomovil: this.colorAutomovil,
    //   numeroPlaca: this.numeroPlaca,
    //   horaEntrada: this.horaEntrada,
    //   horaSalida: this.horaSalida
    // }).subscribe(response => {
    //   console.log('Respuesta de la API:', response);
    // }, error => {
    //   console.error('Error al enviar los datos a la API:', error);
    // });
  
    // Recuerda importar el módulo HttpClient en tu componente si estás utilizando HttpClient.
  }
  horaEntrada(arg0: string, horaEntrada: any) {
    throw new Error('Method not implemented.');
  }
  horaSalida(arg0: string, horaSalida: any) {
    throw new Error('Method not implemented.');
  }


}


