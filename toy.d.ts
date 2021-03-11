interface ToyGlobal {
    (label: string) : Toy;
    ui : ToyUI;
}

interface ToyUI {
    (parent : HTMLElement) : void;
    selector(selector : {
        test(value : any) : boolean;
        ui : ToyControl;
        toUi(value : any) : any;
        fromUi(value : any) : any;
    }) : void;
    controls : {
        range : ToyControl;
        text : ToyControl;
        checkbox : ToyControl;
        color : ToyControl;
        vec3 : ToyControl;
    }
}

interface Toy {

    readonly label: string;
    readonly defaultValue: any;
    readonly options: any;

    <T>(defaultValue : T) : T;
    set(value : any) : void;

    range(min: number, max: number, step: number?) : Toy;
    ui(ui : ToyControl) : Toy;
}

declare function ToyControl 
    (args : {
        options : any;
        value : any;
        oninput : (value : any) => void;
    }) : HTMLElement;
  
export var toy : ToyGlobal;
