import { useState, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ShopifyProduct } from '@/lib/shopify';
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_API_KEY = '';
const DEFAULT_MODEL = 'gemini-1.5-pro'; // Fallback safer model, though user can override

export const AVAILABLE_MODELS = [
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Recomendado)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'custom', label: 'Escribir nombre de modelo...' },
];

const PROMPT_CONTEXT = `
# 📋 GUÍA DE CREACIÓN DE DESCRIPCIONES DE PRODUCTOS PARA E-COMMERCE

## 🎯 ESTRUCTURA GENERAL

Cada producto debe incluir:
1. **Título y Subtítulo** (con alternativas)
2. **Versión 1 - Descripción Corta**
3. **Versión 2 - Descripción Detallada**

---

## 📝 1. TÍTULO Y SUBTÍTULO

### Formato Principal:
\`\`\`
[Nombre del Producto] - [Subtítulo Descriptivo y Detallado]
\`\`\`
Regla: El guión "-" separa título principal de subtítulo.

### Reglas para Títulos (Parte izquierda):
✅ **SÍ:** Mencionar tipo de producto, característica destacada, palabras clave. 3-6 palabras.
❌ **NO:** Mencionar marcas (salvo que sea el producto), superlativos, precios.

### Reglas para Subtítulos (Parte derecha):
✅ **SÍ:** Describir la prenda en detalle. Incluir material, corte, cuello, largo, patrón o uso específico.
✅ **EJEMPLOS BUENOS:**
- "Vestido Maxi Plisado con Cuello en V - Elegante con Lazo en Cintura y Botones"
- "Funda Decorativa de Lino 45x45cm - Diseño Animal con Impresión HD"
- "Pantalón Cargo Ajustado - Algodón Elástico con Bolsillos Laterales y Cintura Alta"
❌ **EJEMPLOS MALOS (EVITAR):**
- "Estilo Ligero y Moderno" (Muy genérico)
- "Alta Calidad" (Subjetivo)
- "Ropa de Mujer" (Obvio)

---

## 📄 2. VERSIÓN 1 - DESCRIPCIÓN CORTA (Campo "about")

### Propósito:
Información rápida y esencial para el cliente que busca datos específicos.

### Estructura:
\`\`\`
Material: [Material principal]
Tallas/Tamaños: [Opciones disponibles]
Estilo: [Estilo del producto]
Características: [2-4 características principales]

Colores disponibles: [Lista de colores]

[Información adicional relevante si aplica]

**Incluye:** [Contenido del paquete]
\`\`\`

### Reglas:
- **Longitud**: 80-120 palabras máximo
- **Formato**: Líneas cortas, datos directos
- **Sin emojis** en esta versión
- **Sin narrativa**, solo información factual
- **IMPORTANTE: NO USES MARKDOWN BOLD (**) EN ESTA SECCIÓN. Usa texto plano.**

---

## 📖 3. VERSIÓN 2 - DESCRIPCIÓN DETALLADA (Campo "description")

### Propósito:
Descripción completa que persuade, informa y ayuda a la decisión de compra.

### Estructura Modular:
(Usa etiquetas HTML <h3> para títulos de sección. USA SIEMPRE <strong> PARA NEGRITA. ESTÁ PROHIBIDO USAR ASTERISCOS **).

\`\`\`
<h3>🎯 CARACTERÍSTICA PRINCIPAL</h3>
[Explicación de la característica más destacada]

<strong>Detalles:</strong>
- Punto 1
- Punto 2

<hr/>

<h3>✨ MATERIALES/TECNOLOGÍA</h3>
[Explicación de materiales o tecnología]

<strong>Ventajas:</strong>
✅ Beneficio 1
✅ Beneficio 2

<hr/>

<h3>📐 ESPECIFICACIONES:</h3>
- <strong>Medida 1</strong>: Valor
- <strong>Material</strong>: Detalle

<hr/>

<h3>🎨 COLORES/VARIANTES:</h3>
<ul>
<li>[Emoji] [Color]: [Descripción breve]</li>
</ul>
(Usa lista HTML <ul> y <li> para que salgan uno debajo del otro).

<hr/>

<h3>📦 CONTENIDO DEL PAQUETE:</h3>
- [Lista de lo que incluye]

<h3>⚠️ NOTAS IMPORTANTES:</h3>
- [Avisos relevantes, tallas asiáticas, etc]
\`\`\`

### Reglas:
- 300-500 palabras máximo.
- Priorizar información que impacta decisión de compra.
- Emojis permitidos en títulos de sección y listas.
- Tono profesional pero accesible (tú).
- Usa <strong> para texto en negrita, NO uses MARKDOWN BOLD **.

## 🎯 FORMATO OBLIGATORIO DE SALIDA (JSON):
{
  "title": "Nombre Limpio del Producto (Ej: Nike Windrunner)",
  "subtitle": "Subtítulo descriptivo (Ej: Chaqueta de plumón)",
  "gender": "Género (Ej: Hombre, Mujer, Unisex)",
  "highlight": "Característica destacada corta (Ej: Materiales reciclados)",
  "about": "Texto de la Versión 1 (Descripción Corta) con saltos de línea \\n. SIN ASTERISCOS (**).",
  "description": "HTML completo de la Versión 2 (Descripción Detallada). Usa <h3> para títulos y <strong> para negrita. NO USES **."
}
`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Nombre Limpio del Producto (Sin subtítulo, sin guiones, sin género)." },
    subtitle: { type: SchemaType.STRING, description: "Subtítulo MUY DESCRIPTIVO. Debe explicar qué es el producto, materiales, corte, diseño, etc. Evitar frases genéricas como 'Estilo Moderno'. Usar 10-20 palabras si es necesario." },
    gender: { type: SchemaType.STRING, description: "Género objetivo: Hombre, Mujer, Unisex, Niños, etc." },
    highlight: { type: SchemaType.STRING, description: "Característica destacada corta (2-4 palabras) para poner encima del título." },
    about: { type: SchemaType.STRING, description: "Resumen breve para la sección 'Acerca de' (80-100 palabras). Texto plano sin Markdown." },
    description: { type: SchemaType.STRING, description: "Descripción detallada completa en HTML/Markdown con emojis." },
  },
  required: ["title", "subtitle", "gender", "highlight", "about", "description"],
};

export interface GeneratedResult {
  id: string;
  originalTitle: string;
  generatedTitle: string;
  generatedSubtitle: string;
  generatedGender: string;
  generatedHighlight: string;
  generatedAbout: string;
  generatedDescription: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  error?: string;
  selectedForSave?: {
    title: boolean;
    about: boolean;
    description: boolean;
  };
}

export function useProductAI() {
  const { user } = useAuth();
  const [apiKey, setLocalApiKey] = useState(() => localStorage.getItem('google_ai_key') || DEFAULT_API_KEY);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('google_ai_model') || DEFAULT_MODEL);
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('google_ai_custom_model') || '');
  
  // Image Gen Settings
  const [imageApiUrl, setImageApiUrl] = useState(() => localStorage.getItem('image_gen_url') || '');
  const [imageApiKey, setLocalImageApiKey] = useState(() => localStorage.getItem('image_gen_key') || '');

  // Sync from Cloud (Supabase User Metadata)
  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      
      if (meta.google_ai_key && meta.google_ai_key !== apiKey) {
        setLocalApiKey(meta.google_ai_key);
        localStorage.setItem('google_ai_key', meta.google_ai_key);
      }
      
      if (meta.image_gen_key && meta.image_gen_key !== imageApiKey) {
        setLocalImageApiKey(meta.image_gen_key);
        localStorage.setItem('image_gen_key', meta.image_gen_key);
      }
    }
  }, [user]);

  // Wrappers to save to both LocalStorage and Cloud
  const setApiKey = (key: string) => {
    setLocalApiKey(key);
    localStorage.setItem('google_ai_key', key);
  };

  const saveApiKeyToCloud = async (key: string) => {
    if (user) {
      const { error } = await supabase.auth.updateUser({ data: { google_ai_key: key } });
      if (error) throw error;
    }
  };

  const setImageApiKey = (key: string) => {
    setLocalImageApiKey(key);
    localStorage.setItem('image_gen_key', key);
  };

  const saveImageApiKeyToCloud = async (key: string) => {
    if (user) {
      const { error } = await supabase.auth.updateUser({ data: { image_gen_key: key } });
      if (error) throw error;
    }
  };

  // Persist settings (Legacy/Fallback effects)
  useEffect(() => {
    localStorage.setItem('google_ai_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('google_ai_custom_model', customModel);
  }, [customModel]);

  useEffect(() => {
    localStorage.setItem('image_gen_url', imageApiUrl);
  }, [imageApiUrl]);

  const analyzeProduct = useCallback(async (
    product: ShopifyProduct, 
    onStart: (id: string) => void,
    onSuccess: (id: string, result: GeneratedResult) => void,
    onError: (id: string, error: string) => void
  ) => {
    const id = product.node.id;
    onStart(id);

    try {
      // Fetch up to 3 images
      const images = product.node.images.edges.slice(0, 3).map(edge => edge.node.url);
      if (images.length === 0) throw new Error('Sin imagen');

      const imageParts = await Promise.all(images.map(async (url) => {
        try {
          const imageResponse = await fetch(url);
          if (!imageResponse.ok) return null;
          const imageBlob = await imageResponse.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(imageBlob);
          });
          return {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64
            }
          };
        } catch (e) {
          console.warn("Failed to fetch image for analysis", url, e);
          return null;
        }
      }));

      const validImageParts = imageParts.filter(p => p !== null);

      const modelToUse = selectedModel === 'custom' ? customModel : selectedModel;
      const genAI = new GoogleGenerativeAI(apiKey);

      const optionsContext = product.node.options.map(opt => `${opt.name}: ${opt.values.join(', ')}`).join('\n');
      const fullContext = `${PROMPT_CONTEXT}\n\n## 📊 DATOS DEL PRODUCTO EXISTENTE:\n${optionsContext}\n\nTítulo actual: ${product.node.title}`;

      const makeApiCall = async (retryCount = 0): Promise<any> => {
        try {
          // Initialize model with generation config including schema
          const model = genAI.getGenerativeModel({ 
            model: modelToUse,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.7,
            }
          });

          const parts: any[] = [{ text: fullContext }];
          validImageParts.forEach(part => parts.push(part));

          const result = await model.generateContent(parts);
          return result.response;
        } catch (error: any) {
          const errorString = error.toString();
          if (retryCount < 2 && (errorString.includes('429') || errorString.includes('503') || errorString.includes('500') || errorString.includes('fetch'))) {
             await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
             return makeApiCall(retryCount + 1);
          }
          throw error;
        }
      };

      const response = await makeApiCall();
      const textResponse = response.text();
      
      if (!textResponse) throw new Error("Sin respuesta de IA");

      let parsed;
      try {
        parsed = JSON.parse(textResponse);
      } catch (e) {
        parsed = { title: '', subtitle: '', gender: '', highlight: '', about: '', description: textResponse };
      }

      onSuccess(id, {
        id,
        originalTitle: product.node.title,
        generatedTitle: parsed.title || '',
        generatedSubtitle: parsed.subtitle || '',
        generatedGender: parsed.gender || '',
        generatedHighlight: parsed.highlight || '',
        generatedAbout: parsed.about || '',
        generatedDescription: parsed.description || '',
        status: 'done',
        selectedForSave: { title: true, about: true, description: true }
      });

    } catch (error: any) {
      console.error(`Error analyzing ${id}:`, error);
      onError(id, error.message || 'Error desconocido');
    }
  }, [apiKey, selectedModel, customModel]);

  // Image Generation Function (Nano Banana Pro / Gemini Image)
  const generateImage = useCallback(async (
    imageUrl: string,
    onSuccess: (newImageUrl: string) => void,
    onError: (error: string) => void,
    options?: { width?: number; height?: number }
  ) => {
    try {
      console.log("Generando imagen desde:", imageUrl);
      
      // 1. Convert image URL to Base64 (Required for Google API)
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      // 2. Determine API Endpoint & Key
      // Default to Google Gemini 3 Pro Image (Nano Banana Pro) if no custom URL is set
      const targetUrl = imageApiUrl || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${imageApiKey || apiKey}`;
      const targetKey = imageApiKey || apiKey;

      if (!targetKey) {
        throw new Error('Necesitas una API Key (Google AI Studio) para generar imágenes.');
      }

      let body;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // 3. Prepare Payload based on Provider
      if (targetUrl.includes('googleapis.com')) {
        // Google Gemini Format
        body = {
          contents: [{
            parts: [
              { text: "Professional product photography, clean background, studio lighting, 4k, highly detailed. Maintain the product appearance but enhance quality and lighting." },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        };
      } else {
        // Generic / Nano Banana Wrapper Format
        headers['Authorization'] = `Bearer ${targetKey}`;
        body = {
          init_image: imageUrl, // Some APIs might need base64 too, but let's assume URL for wrappers
          prompt: "Professional product photography, clean background, studio lighting, 4k, highly detailed",
          strength: 0.75,
          width: options?.width || 1024,
          height: options?.height || 1024,
        };
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Error en API de imagen');
      }
      
      // 4. Parse Response
      let outputUrl = null;

      // Google Response Handling
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const part = data.candidates[0].content.parts.find((p: any) => p.inline_data);
        if (part) {
          // Convert base64 back to blob URL for display
          const byteCharacters = atob(part.inline_data.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: part.inline_data.mime_type || 'image/png' });
          outputUrl = URL.createObjectURL(blob);
        }
      } 
      // Generic / Wrapper Response Handling
      else {
        outputUrl = data.output_url || data.url || data.image || (Array.isArray(data.output) ? data.output[0] : null);
      }
      
      if (!outputUrl) {
        console.error("Respuesta API:", data);
        throw new Error('La API no devolvió una imagen válida');
      }

      onSuccess(outputUrl); 
      
    } catch (error: any) {
      console.error("Error generating image:", error);
      onError(error.message || 'Error al generar imagen');
    }
  }, [apiKey, imageApiUrl, imageApiKey]);

  const translateContent = useCallback(async (
    content: string, 
    targetLang: string = 'Spanish'
  ): Promise<string> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelToUse = selectedModel === 'custom' ? customModel : selectedModel;
      const model = genAI.getGenerativeModel({ model: modelToUse });
      
      const prompt = `Translate the following text to ${targetLang}. Return ONLY the translated text, no explanations or quotes. Keep the same casing if possible.\n\nText: "${content}"`;
      
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }, [apiKey, selectedModel, customModel]);

  const translateOptions = useCallback(async (
    options: { name: string, values: string[] }[]
  ): Promise<{ name: string, values: string[] }[]> => {
    try {
      const currentApiKey = apiKey || localStorage.getItem('google_ai_key') || DEFAULT_API_KEY;
      if (!currentApiKey) {
        throw new Error("No API Key found");
      }
      
      const genAI = new GoogleGenerativeAI(currentApiKey);
      const modelToUse = selectedModel === 'custom' ? customModel : selectedModel;
      const model = genAI.getGenerativeModel({ model: modelToUse });
      
      const prompt = `
        Translate the following product options and values to Spanish.
        Return ONLY a valid JSON array with the same structure, no markdown formatting.
        Example input: [{"name": "Size", "values": ["Small", "Large"]}]
        Example output: [{"name": "Talla", "values": ["Pequeño", "Grande"]}]
        
        Input:
        ${JSON.stringify(options)}
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Invalid JSON response");
    } catch (error) {
      console.error("Options translation error:", error);
      throw error;
    }
  }, [apiKey, selectedModel, customModel]);

  const generateSingleField = useCallback(async (
    field: 'title' | 'subtitle' | 'gender' | 'highlight' | 'about' | 'description',
    productTitle: string,
    productContext: string = ''
  ): Promise<string> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelToUse = selectedModel === 'custom' ? customModel : selectedModel;
      const model = genAI.getGenerativeModel({ model: modelToUse });
      
      let prompt = "";
      
      switch(field) {
        case 'title':
          prompt = `Genera un Título de Producto limpio para E-commerce en Español para: "${productTitle}".
          Contexto: ${productContext}
          Reglas: Solo el nombre del producto, sin subtítulos, sin marcas, 3-6 palabras. Capitalizado.
          Ejemplo: "Camiseta Deportiva Transpirable"`;
          break;
        case 'subtitle':
          prompt = `Genera un Subtítulo descriptivo en Español para: "${productTitle}".
          Contexto: ${productContext}
          Reglas: Describe material, corte, diseño. 10-15 palabras. Muy detallado.
          Ejemplo: "Algodón Premium Corte Regular con Estampado HD"`;
          break;
        case 'gender':
          prompt = `Determina el género para: "${productTitle}".
          Contexto: ${productContext}
          Opciones: Hombre, Mujer, Unisex, Niños, Niñas, Bebé.
          Responde SOLO con una de las opciones.`;
          break;
        case 'highlight':
          prompt = `Genera un Highlight (destacado) corto (2-4 palabras) en Español para: "${productTitle}".
          Contexto: ${productContext}
          Ejemplo: "Material Reciclado", "Edición Limitada", "Envío Rápido".`;
          break;
        case 'about':
          prompt = `Genera una descripción corta (About) en Español para: "${productTitle}".
          Contexto: ${productContext}
          Reglas: 80-100 palabras, lista de características clave, materiales, sin markdown bold (**), saltos de línea normales.`;
          break;
        case 'description':
          prompt = `Genera una descripción detallada en HTML para: "${productTitle}".
          Contexto: ${productContext}
          Reglas: Usa <h3> para títulos, <strong> para negrita, listas <ul>. Estructura de venta persuasiva. En Español.`;
          break;
      }
      
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error(`Error generating ${field}:`, error);
      throw error;
    }
  }, [apiKey, selectedModel, customModel]);

  return {
    apiKey, setApiKey, saveApiKeyToCloud,
    selectedModel, setSelectedModel,
    customModel, setCustomModel,
    analyzeProduct,
    generateImage,
    translateContent,
    translateOptions,
    generateSingleField,
    imageApiKey, setImageApiKey, saveImageApiKeyToCloud,
    imageApiUrl, setImageApiUrl
  };
}
